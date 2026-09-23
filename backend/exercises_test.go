package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// The thirteen muscle categories in Stavros's order, each with the muscles it
// covers. Rear delts sit with the other delt heads under Shoulders.
var wantCategories = []struct {
	name    string
	muscles []string
}{
	{"Chest", []string{"Chest"}},
	{"Back", []string{"Lats", "Traps", "Erectors"}},
	{"Biceps", []string{"Biceps"}},
	{"Triceps", []string{"Triceps"}},
	{"Shoulders", []string{"Delts", "Side delts", "Rear delts"}},
	{"Quads", []string{"Quads"}},
	{"Hamstrings", []string{"Hamstrings"}},
	{"Adductors", []string{"Adductors"}},
	{"Glutes", []string{"Glutes"}},
	{"Calves", []string{"Calves"}},
	{"Abs", []string{"Abs", "Obliques"}},
	{"Forearms", []string{"Forearms", "Brachialis"}},
	{"Neck", []string{"Neck"}},
}

func TestMuscleCategoriesAreSeededInOrder(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	got, err := app.FindRecordsByFilter("muscle_categories", "", "position", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != len(wantCategories) {
		t.Fatalf("categories: got %d, want %d", len(got), len(wantCategories))
	}
	for i, r := range got {
		var muscles []string
		if err := json.Unmarshal([]byte(r.GetString("muscles")), &muscles); err != nil {
			t.Fatal(err)
		}
		if r.GetString("name") != wantCategories[i].name || strings.Join(muscles, ",") != strings.Join(wantCategories[i].muscles, ",") {
			t.Errorf("category %d: got %s %v, want %s %v", i+1, r.GetString("name"), muscles, wantCategories[i].name, wantCategories[i].muscles)
		}
	}
}

// The catalog ships one exercise so far: Flat Bench Press.
func TestTheCatalogIsSeeded(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	all, err := app.FindAllRecords("exercises")
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != 1 {
		t.Fatalf("exercises: got %d, want 1", len(all))
	}
	r := all[0]
	if r.GetString("name") != "Flat Bench Press" || r.GetString("owner") != "" || r.GetString("icon") != "bench" {
		t.Fatalf("got %q owner %q icon %q", r.GetString("name"), r.GetString("owner"), r.GetString("icon"))
	}
	if r.GetString("main_muscle") != category(t, app, "Chest") {
		t.Fatal("main muscle is not Chest")
	}
	secondary := r.GetStringSlice("secondary_muscles")
	want := []string{category(t, app, "Shoulders"), category(t, app, "Triceps")}
	if strings.Join(secondary, ",") != strings.Join(want, ",") {
		t.Fatalf("secondary muscles: got %v, want Shoulders, Triceps", secondary)
	}
	if r.GetString("type") != exerciseType(t, app, "Free weight") {
		t.Fatal("type is not Free weight")
	}
	// Seeded before the validator is bound; held to it all the same.
	if err := app.Validate(r); err != nil {
		t.Fatalf("the seed fails validation: %v", err)
	}
}

// The exercise types, in order. Adding one is a row in exercise_types.
var wantTypes = []string{"Free weight", "Cable", "Machine"}

func TestExerciseTypesAreSeededInOrder(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	got, err := app.FindRecordsByFilter("exercise_types", "", "position", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, r := range got {
		names = append(names, r.GetString("name"))
	}
	if strings.Join(names, ",") != strings.Join(wantTypes, ",") {
		t.Fatalf("types: got %v, want %v", names, wantTypes)
	}
}

func category(t testing.TB, app core.App, name string) string {
	t.Helper()
	r, err := app.FindFirstRecordByFilter("muscle_categories", "name = {:n}", dbx.Params{"n": name})
	if err != nil {
		t.Fatal(err)
	}
	return r.Id
}

func exerciseType(t testing.TB, app core.App, name string) string {
	t.Helper()
	r, err := app.FindFirstRecordByFilter("exercise_types", "name = {:n}", dbx.Params{"n": name})
	if err != nil {
		t.Fatal(err)
	}
	return r.Id
}

func exerciseBody(t testing.TB, app core.App) string {
	b, _ := json.Marshal(map[string]any{
		"name":              "Test Press",
		"icon":              "bench",
		"main_muscle":       category(t, app, "Chest"),
		"secondary_muscles": []string{category(t, app, "Triceps"), category(t, app, "Shoulders")},
		"type":              exerciseType(t, app, "Free weight"),
	})
	return string(b)
}

func TestCatalogRules(t *testing.T) {
	run(t, "anyone reads the categories", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/muscle_categories/records",
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":13`},
		}
	})
	run(t, "anyone reads the exercise types", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/exercise_types/records",
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":3`},
		}
	})
	run(t, "anyone reads the exercises", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/exercises/records",
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":1`, `"name":"Flat Bench Press"`},
		}
	})
	run(t, "a free user cannot add a catalog exercise", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(exerciseBody(t, f.app)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a user cannot add an exercise type", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercise_types/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Aerobic","position":4}`),
			ExpectedStatus:  403,
			ExpectedContent: []string{`"status":403`},
		}
	})
	run(t, "a user cannot change a category", func(f *fixture) tests.ApiScenario {
		r, _ := f.app.FindFirstRecordByFilter("muscle_categories", "name = 'Chest'")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/muscle_categories/records/" + r.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  403,
			ExpectedContent: []string{`"status":403`},
		}
	})
	run(t, "an admin adds an exercise with a main muscle, secondaries and a type", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.adminTok),
			Body:            strings.NewReader(exerciseBody(t, f.app)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Test Press"`},
		}
	})
}

// A new type is a row, and exercises can use it at once.
func TestAddingATypeIsOneRow(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	types, _ := app.FindCollectionByNameOrId("exercise_types")
	aerobic := core.NewRecord(types)
	aerobic.Set("name", "Aerobic")
	aerobic.Set("position", 4)
	if err := app.Save(aerobic); err != nil {
		t.Fatal(err)
	}

	col, _ := app.FindCollectionByNameOrId("exercises")
	r := core.NewRecord(col)
	r.Set("name", "Rowing Machine")
	r.Set("icon", "row")
	r.Set("main_muscle", category(t, app, "Back"))
	r.Set("type", aerobic.Id)
	if err := app.Save(r); err != nil {
		t.Fatalf("an exercise of the new type: %v", err)
	}
}

func TestExerciseShape(t *testing.T) {
	cases := map[string]func(app core.App, r *core.Record){
		"no name":                              func(app core.App, r *core.Record) { r.Set("name", "") },
		"no main muscle":                       func(app core.App, r *core.Record) { r.Set("main_muscle", "") },
		"no type":                              func(app core.App, r *core.Record) { r.Set("type", "") },
		"a main muscle that is not a category": func(app core.App, r *core.Record) { r.Set("main_muscle", "nosuchcategory1") },
		"a type that does not exist":           func(app core.App, r *core.Record) { r.Set("type", "nosuchtypexxxx1") },
		"the main muscle also secondary": func(app core.App, r *core.Record) {
			r.Set("secondary_muscles", []string{category(t, app, "Chest")})
		},
	}
	for name, spoil := range cases {
		t.Run(name, func(t *testing.T) {
			app := newProgramsApp(t)
			defer app.Cleanup()

			col, _ := app.FindCollectionByNameOrId("exercises")
			r := core.NewRecord(col)
			r.Set("name", "Test Press")
			r.Set("icon", "bench")
			r.Set("main_muscle", category(t, app, "Chest"))
			r.Set("secondary_muscles", []string{category(t, app, "Triceps")})
			r.Set("type", exerciseType(t, app, "Free weight"))
			if err := app.Save(r); err != nil {
				t.Fatalf("the valid exercise was refused: %v", err)
			}
			spoil(app, r)
			if err := app.Save(r); err == nil {
				t.Fatal("accepted")
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Custom exercises
// ---------------------------------------------------------------------------

func setPremium(t testing.TB, app core.App, u *core.Record, premium bool) {
	t.Helper()
	if premium {
		u.Set("subscription_status", "premium")
	} else {
		u.Set("subscription_status", "free")
	}
	if err := app.Save(u); err != nil {
		t.Fatal(err)
	}
}

func customBody(t testing.TB, app core.App, owner string) string {
	b, _ := json.Marshal(map[string]any{
		"name":        "My Press",
		"icon":        "bench",
		"owner":       owner,
		"main_muscle": category(t, app, "Chest"),
		"type":        exerciseType(t, app, "Cable"),
	})
	return string(b)
}

// saveExercise writes an exercise directly, as an admin would.
func saveExercise(t testing.TB, app core.App, owner string) *core.Record {
	t.Helper()
	col, _ := app.FindCollectionByNameOrId("exercises")
	r := core.NewRecord(col)
	r.Set("name", "Stored Press")
	r.Set("icon", "bench")
	r.Set("owner", owner)
	r.Set("main_muscle", category(t, app, "Chest"))
	r.Set("type", exerciseType(t, app, "Machine"))
	if err := app.Save(r); err != nil {
		t.Fatal(err)
	}
	return r
}

func TestCustomExerciseRules(t *testing.T) {
	run(t, "a premium user creates their own exercise", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.alice, true)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, f.alice.Id)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"owner":"` + f.alice.Id + `"`},
		}
	})
	run(t, "a free user cannot create one", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, f.alice.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a guest cannot create one", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Body:            strings.NewReader(customBody(t, f.app, "")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a premium user cannot create a catalog exercise", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.alice, true)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, "")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a premium user cannot create one for someone else", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.alice, true)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, f.bob.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "the owner reads their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{mine.Id},
		}
	})
	run(t, "another user cannot open it", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "another user and a guest list the catalog only", func(f *fixture) tests.ApiScenario {
		saveExercise(t, f.app, "")
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:             http.MethodGet,
			URL:                "/api/collections/exercises/records",
			Headers:            auth(f.aliceTok),
			ExpectedStatus:     200,
			ExpectedContent:    []string{`"totalItems":2`},
			NotExpectedContent: []string{mine.Id},
		}
	})
	run(t, "the owner edits their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"name":"Renamed"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Renamed"`},
		}
	})
	run(t, "the owner cannot hand it to someone else", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"owner":"` + f.alice.Id + `"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "the owner cannot turn it into a catalog exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"owner":""}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "another user cannot edit it", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a premium user cannot edit a catalog exercise", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.alice, true)
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + catalog.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a user cannot delete a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/exercises/records/" + catalog.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a guest cannot edit a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + catalog.Id,
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a guest cannot delete a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/exercises/records/" + catalog.Id,
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "an admin edits a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + catalog.Id,
			Headers:         auth(f.adminTok),
			Body:            strings.NewReader(`{"name":"Catalog Press"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Catalog Press"`},
		}
	})
}

// Premium lapses: what the person already made stays theirs to read and use;
// only making another is refused.
func TestLapsedPremium(t *testing.T) {
	run(t, "a lapsed user still reads their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id) // bob is free: premium has lapsed
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{mine.Id},
		}
	})
	run(t, "a lapsed user still edits their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/exercises/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"name":"Still Mine"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Still Mine"`},
		}
	})
	run(t, "a lapsed user cannot create another", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.bob, true)
		saveExercise(t, f.app, f.bob.Id)
		setPremium(t, f.app, f.bob, false)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(customBody(t, f.app, f.bob.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
}

func TestDeletingAUserDeletesTheirExercises(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	catalog := saveExercise(t, f.app, "")
	mine := saveExercise(t, f.app, f.bob.Id)
	if err := f.app.Delete(f.bob); err != nil {
		t.Fatal(err)
	}
	if _, err := f.app.FindRecordById("exercises", mine.Id); err == nil {
		t.Fatal("the deleted user's exercise is still there")
	}
	if _, err := f.app.FindRecordById("exercises", catalog.Id); err != nil {
		t.Fatal("the catalog exercise went with the user")
	}
}
