package main

import (
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// Every test starts from an empty data directory, so what it sees is exactly
// what the migrations build — the same collection and the same three
// templates a fresh server gets.
func newProgramsApp(t testing.TB) *tests.TestApp {
	t.Helper()

	dir, err := os.MkdirTemp("", "alke_programs_*")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })

	app, err := tests.NewTestApp(dir)
	if err != nil {
		t.Fatal(err)
	}
	bindPrograms(app)
	return app
}

type fixture struct {
	app      *tests.TestApp
	alice    *core.Record
	bob      *core.Record
	aliceTok string
	bobTok   string
	adminTok string
	template *core.Record // "Full Body"
	bobsCopy *core.Record
}

func newFixture(t testing.TB) *fixture {
	t.Helper()
	app := newProgramsApp(t)
	f := &fixture{app: app}

	f.alice = newUser(t, app, "alice@alke.test")
	f.bob = newUser(t, app, "bob@alke.test")
	f.aliceTok = token(t, f.alice)
	f.bobTok = token(t, f.bob)

	superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
	if err != nil {
		t.Fatal(err)
	}
	admin := core.NewRecord(superusers)
	admin.SetEmail("admin@alke.test")
	admin.SetPassword("admin-test-password")
	if err := app.Save(admin); err != nil {
		t.Fatal(err)
	}
	f.adminTok = token(t, admin)

	f.template, err = app.FindFirstRecordByFilter("programs", "owner = '' && name = 'Full Body'")
	if err != nil {
		t.Fatal(err)
	}

	f.bobsCopy = saveCopy(t, app, f.template, f.bob)
	return f
}

func newUser(t testing.TB, app core.App, email string) *core.Record {
	t.Helper()
	users, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		t.Fatal(err)
	}
	u := core.NewRecord(users)
	u.SetEmail(email)
	u.SetPassword("user-test-password")
	if err := app.Save(u); err != nil {
		t.Fatal(err)
	}
	return u
}

func token(t testing.TB, r *core.Record) string {
	t.Helper()
	tok, err := r.NewAuthToken()
	if err != nil {
		t.Fatal(err)
	}
	return tok
}

// What saving a template does: a new row, owned by the person, carrying the
// template's schedule and days and pointing back at it.
func saveCopy(t testing.TB, app core.App, from *core.Record, owner *core.Record) *core.Record {
	t.Helper()
	c := core.NewRecord(from.Collection())
	c.Set("name", from.GetString("name"))
	c.Set("owner", owner.Id)
	c.Set("copied_from", from.Id)
	c.Set("schedule", from.Get("schedule"))
	c.Set("days", from.Get("days"))
	if err := app.Save(c); err != nil {
		t.Fatal(err)
	}
	return c
}

func copyBody(f *fixture, owner string) string {
	b, _ := json.Marshal(map[string]any{
		"name":        f.template.GetString("name"),
		"owner":       owner,
		"copied_from": f.template.Id,
		"schedule":    f.template.Get("schedule"),
		"days":        f.template.Get("days"),
	})
	return string(b)
}

func auth(tok string) map[string]string {
	if tok == "" {
		return nil
	}
	return map[string]string{"Authorization": tok}
}

// run builds a fresh fixture for the scenario, so no scenario sees another's
// writes.
func run(t *testing.T, name string, build func(f *fixture) tests.ApiScenario) {
	t.Run(name, func(t *testing.T) {
		f := newFixture(t)
		s := build(f)
		s.Name = name
		s.TestAppFactory = func(testing.TB) *tests.TestApp { return f.app }
		s.Test(t)
	})
}

// ---------------------------------------------------------------------------
// The three templates
// ---------------------------------------------------------------------------

func TestTemplatesAreSeeded(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	want := map[string][]string{
		"Full Body":           {"training", "rest", "training", "rest", "training", "rest", "rest"},
		"Upper / Lower":       {"training", "training", "rest", "training", "training", "rest", "rest"},
		"Push / Pull / Lower": {"training", "training", "training", "training", "training", "training", "rest"},
	}
	wantDays := map[string]map[string][]string{
		"Full Body": {
			"monday": {"Full body"}, "wednesday": {"Full body"}, "friday": {"Full body"},
		},
		"Upper / Lower": {
			"monday": {"Upper"}, "tuesday": {"Lower"}, "thursday": {"Upper"}, "friday": {"Lower"},
		},
		"Push / Pull / Lower": {
			"monday": {"Push"}, "tuesday": {"Pull"}, "wednesday": {"Lower"},
			"thursday": {"Push"}, "friday": {"Pull"}, "saturday": {"Lower"},
		},
	}

	templates, err := app.FindRecordsByFilter("programs", "owner = ''", "", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(templates) != len(want) {
		t.Fatalf("templates: got %d, want %d", len(templates), len(want))
	}

	for _, tpl := range templates {
		name := tpl.GetString("name")
		schedule, ok := want[name]
		if !ok {
			t.Fatalf("unexpected template %q", name)
		}

		var gotSchedule []string
		if err := json.Unmarshal([]byte(tpl.GetString("schedule")), &gotSchedule); err != nil {
			t.Fatal(err)
		}
		if strings.Join(gotSchedule, ",") != strings.Join(schedule, ",") {
			t.Errorf("%s schedule: got %v, want %v", name, gotSchedule, schedule)
		}

		var gotDays []programDay
		if err := json.Unmarshal([]byte(tpl.GetString("days")), &gotDays); err != nil {
			t.Fatal(err)
		}
		if len(gotDays) != len(wantDays[name]) {
			t.Errorf("%s: got %d days, want %d", name, len(gotDays), len(wantDays[name]))
		}
		for _, d := range gotDays {
			var names []string
			for _, w := range d.Workouts {
				names = append(names, w.Name)
			}
			if strings.Join(names, ",") != strings.Join(wantDays[name][d.Weekday], ",") {
				t.Errorf("%s %s: got %v, want %v", name, d.Weekday, names, wantDays[name][d.Weekday])
			}
		}

		if tpl.GetString("copied_from") != "" || tpl.GetBool("active") {
			t.Errorf("%s: a template is copied from nothing and is never active", name)
		}

		// The seed was written before the validator was bound; hold it to
		// the same rules everything else is held to.
		if err := app.Validate(tpl); err != nil {
			t.Errorf("%s fails validation: %v", name, err)
		}
	}
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

func TestReadRules(t *testing.T) {
	run(t, "a guest sees the three templates and nothing else", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:             http.MethodGet,
			URL:                "/api/collections/programs/records",
			ExpectedStatus:     200,
			ExpectedContent:    []string{`"totalItems":3`},
			NotExpectedContent: []string{f.bobsCopy.Id},
		}
	})

	run(t, "a user sees the templates and not another user's copy", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:             http.MethodGet,
			URL:                "/api/collections/programs/records",
			Headers:            auth(f.aliceTok),
			ExpectedStatus:     200,
			ExpectedContent:    []string{`"totalItems":3`},
			NotExpectedContent: []string{f.bobsCopy.Id},
		}
	})

	run(t, "the owner sees their own copy", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":4`, f.bobsCopy.Id},
		}
	})

	run(t, "a user cannot open another user's program by id", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a guest cannot open a user's program by id", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a user cannot reach another user's program through a filter", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records?filter=" + urlq("owner='"+f.bob.Id+"'"),
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":0`},
		}
	})
}

// Library is the person's own programs: owner = them. Empty until they save
// one, then it holds it. A client filter cannot name @request (PocketBase keeps
// that for superusers), so the app asks by its own id.
func TestLibraryQuery(t *testing.T) {
	library := func(u *core.Record) string {
		return "/api/collections/programs/records?filter=" + urlq("owner = '"+u.Id+"'")
	}

	run(t, "an empty library holds nothing", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             library(f.alice),
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":0`},
		}
	})

	run(t, "a saved template is in the library", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             library(f.bob),
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":1`, f.bobsCopy.Id},
		}
	})
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

func TestWriteRules(t *testing.T) {
	run(t, "a user saves a template as their own copy", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(copyBody(f, f.alice.Id)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"owner":"` + f.alice.Id + `"`, `"copied_from":"` + f.template.Id + `"`},
		}
	})

	run(t, "a guest cannot create a program", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Body:            strings.NewReader(copyBody(f, "")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})

	run(t, "a user cannot create a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(copyBody(f, "")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})

	run(t, "a user cannot create a program for another user", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(copyBody(f, f.bob.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})

	run(t, "a user cannot copy another user's program", func(f *fixture) tests.ApiScenario {
		b, _ := json.Marshal(map[string]any{
			"name":        "x",
			"owner":       f.alice.Id,
			"copied_from": f.bobsCopy.Id,
			"schedule":    f.bobsCopy.Get("schedule"),
			"days":        f.bobsCopy.Get("days"),
		})
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(string(b)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})

	run(t, "the owner edits their copy", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"name":"Mine"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Mine"`},
		}
	})

	run(t, "the owner cannot turn their copy into a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"owner":""}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "the owner cannot give their copy to another user", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"owner":"` + f.alice.Id + `"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "the owner cannot rewrite what their copy came from", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"copied_from":""}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a user cannot edit another user's program", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a user cannot delete another user's program", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "the owner deletes their copy", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:         http.MethodDelete,
			URL:            "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:        auth(f.bobTok),
			ExpectedStatus: 204,
		}
	})

	run(t, "a user cannot edit a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a guest cannot edit a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a user cannot delete a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a guest cannot delete a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "an admin edits a template", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			Headers:         auth(f.adminTok),
			Body:            strings.NewReader(`{"name":"Full Body, edited"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Full Body, edited"`},
		}
	})
}

// A copy is its own row. Editing the template afterwards leaves it alone.
func TestEditingTheTemplateLeavesTheCopy(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	before := f.bobsCopy.GetString("days")

	f.template.Set("name", "Renamed")
	f.template.Set("days", `[{"weekday":"monday","workouts":[{"name":"Changed","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"Changed","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"Changed","icon":"upper"}]}]`)
	if err := f.app.Save(f.template); err != nil {
		t.Fatal(err)
	}

	got, err := f.app.FindRecordById("programs", f.bobsCopy.Id)
	if err != nil {
		t.Fatal(err)
	}
	if got.GetString("name") != "Full Body" || got.GetString("days") != before {
		t.Fatalf("the copy changed with the template: %s / %s", got.GetString("name"), got.GetString("days"))
	}
}

// Deleting a person takes their programs with them. Without the cascade the
// relation would be emptied instead, and an empty owner means template — their
// programs would become readable by everyone.
func TestDeletingAUserDeletesTheirPrograms(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	if err := f.app.Delete(f.bob); err != nil {
		t.Fatal(err)
	}
	if _, err := f.app.FindRecordById("programs", f.bobsCopy.Id); err == nil {
		t.Fatal("the deleted user's program is still there")
	}
	templates, _ := f.app.FindRecordsByFilter("programs", "owner = ''", "", 0, 0)
	if len(templates) != 3 {
		t.Fatalf("templates after deleting a user: got %d, want 3", len(templates))
	}
}

// Deleting a template leaves the copies made from it.
func TestDeletingATemplateLeavesItsCopies(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	if err := f.app.Delete(f.template); err != nil {
		t.Fatal(err)
	}
	got, err := f.app.FindRecordById("programs", f.bobsCopy.Id)
	if err != nil {
		t.Fatal("the copy went with the template")
	}
	if got.GetString("owner") != f.bob.Id {
		t.Fatal("the copy lost its owner")
	}
}

// ---------------------------------------------------------------------------
// One active program
// ---------------------------------------------------------------------------

func TestOneActiveProgram(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	f.bobsCopy.Set("active", true)
	if err := f.app.Save(f.bobsCopy); err != nil {
		t.Fatalf("first active program: %v", err)
	}

	second := saveCopy(t, f.app, f.template, f.bob)
	second.Set("active", true)
	if err := f.app.Save(second); err == nil {
		t.Fatal("a second active program was accepted")
	}

	// Another person's active program is not in the way.
	alices := saveCopy(t, f.app, f.template, f.alice)
	alices.Set("active", true)
	if err := f.app.Save(alices); err != nil {
		t.Fatalf("another user's active program: %v", err)
	}
}

func TestATemplateIsNeverActive(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	f.template.Set("active", true)
	if err := f.app.Save(f.template); err == nil {
		t.Fatal("an active template was accepted")
	}
}

// ---------------------------------------------------------------------------
// Shape of a program
// ---------------------------------------------------------------------------

func TestShapeValidation(t *testing.T) {
	cases := map[string]struct {
		schedule any
		days     any
	}{
		"a week that is not seven days": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a day that is neither training nor rest": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "maybe"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a training day with no day entry": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a rest day with workouts": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"tuesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a training day with no workouts": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"days out of week order": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"monday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a workout with no name": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"  ","icon":"upper"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a workout with an unknown icon": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"squat"}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
		"a workout carrying anything but a name and an icon": {
			schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
			days:     `[{"weekday":"monday","workouts":[{"name":"A","icon":"upper","exercises":[]}]},{"weekday":"wednesday","workouts":[{"name":"A","icon":"upper"}]},{"weekday":"friday","workouts":[{"name":"A","icon":"upper"}]}]`,
		},
	}

	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			f := newFixture(t)
			defer f.app.Cleanup()

			f.bobsCopy.Set("schedule", c.schedule)
			f.bobsCopy.Set("days", c.days)
			if err := f.app.Save(f.bobsCopy); err == nil {
				t.Fatal("accepted")
			}
		})
	}
}

func urlq(s string) string { return url.QueryEscape(s) }
