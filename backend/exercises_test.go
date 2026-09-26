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

// Every catalog exercise: name, icon, main muscle, secondary muscles in order,
// type, and the category it lands in — the one its main muscle belongs to.
var wantCatalog = []struct {
	name      string
	icon      string
	main      string
	secondary []string
	kind      string
	category  string
}{
	{"Flat Barbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Incline Barbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Decline Barbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Flat Dumbbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Incline Dumbbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Decline Dumbbell Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Free weight", "Chest"},
	{"Flat Smith Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Machine", "Chest"},
	{"Incline Smith Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Machine", "Chest"},
	{"Decline Smith Chest Press", "bench", "Chest", []string{"Front delts", "Triceps"}, "Machine", "Chest"},
	{"Chest Press Machine", "bench", "Chest", []string{"Front delts", "Triceps"}, "Machine", "Chest"},
	{"Dip", "bench", "Chest", []string{"Triceps", "Front delts"}, "Free weight", "Chest"},
	{"Push-up", "bench", "Chest", []string{"Triceps", "Front delts"}, "Free weight", "Chest"},
	{"Cable Fly", "bench", "Chest", []string{"Front delts"}, "Cable", "Chest"},
	{"Pec Deck", "bench", "Chest", []string{"Front delts"}, "Machine", "Chest"},
	{"Dumbbell Fly", "bench", "Chest", []string{"Front delts"}, "Free weight", "Chest"},
	{"Wide-Grip Lat Pulldown", "row", "Lats", []string{"Biceps", "Rear delts", "Traps"}, "Cable", "Back"},
	{"Close-Grip Lat Pulldown", "row", "Lats", []string{"Biceps"}, "Cable", "Back"},
	{"Neutral-Grip Machine Pulldown", "row", "Lats", []string{"Biceps"}, "Machine", "Back"},
	{"Pull-up", "row", "Lats", []string{"Biceps", "Traps"}, "Free weight", "Back"},
	{"Chin-up", "row", "Lats", []string{"Biceps"}, "Free weight", "Back"},
	{"Straight-Arm Pulldown", "row", "Lats", []string{"Triceps"}, "Cable", "Back"},
	{"Barbell Row", "row", "Lats", []string{"Traps", "Rear delts", "Biceps"}, "Free weight", "Back"},
	{"Pendlay Row", "row", "Lats", []string{"Traps", "Rear delts", "Biceps"}, "Free weight", "Back"},
	{"Dumbbell Row", "row", "Lats", []string{"Traps", "Biceps"}, "Free weight", "Back"},
	{"T-Bar Row", "row", "Lats", []string{"Traps", "Biceps"}, "Free weight", "Back"},
	{"Chest-Supported Wide Row", "row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Machine", "Back"},
	{"Chest-Supported Close Row", "row", "Lats", []string{"Traps", "Biceps"}, "Machine", "Back"},
	{"Close-Grip Seated Cable Row", "row", "Lats", []string{"Traps", "Biceps"}, "Cable", "Back"},
	{"Wide-Grip Seated Cable Row", "row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Cable", "Back"},
	{"Inverted Row", "row", "Traps", []string{"Lats", "Biceps"}, "Free weight", "Back"},
	{"Barbell Shrug", "row", "Traps", nil, "Free weight", "Back"},
	{"Dumbbell Shrug", "row", "Traps", nil, "Free weight", "Back"},
	{"Smith Shrug", "row", "Traps", nil, "Machine", "Back"},
	{"Machine Shrug", "row", "Traps", nil, "Machine", "Back"},
}

func TestTheCatalogIsSeeded(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	all, err := app.FindAllRecords("exercises")
	if err != nil {
		t.Fatal(err)
	}
	if len(all) != len(wantCatalog) {
		t.Fatalf("exercises: got %d, want %d", len(all), len(wantCatalog))
	}
	// The two left over from before the naming convention are gone, and Face
	// Pull is not in the catalog.
	for _, old := range []string{"Flat Bench Press", "Incline Bench Press", "Face Pull"} {
		if _, err := app.FindFirstRecordByFilter("exercises", "name = {:n}", dbx.Params{"n": old}); err == nil {
			t.Fatalf("%s is still in the catalog", old)
		}
	}
	for _, w := range wantCatalog {
		r, err := app.FindFirstRecordByFilter("exercises", "name = {:n}", dbx.Params{"n": w.name})
		if err != nil {
			t.Fatalf("%s: %v", w.name, err)
		}
		if r.GetString("owner") != "" || r.GetString("icon") != w.icon {
			t.Fatalf("%s: owner %q icon %q", w.name, r.GetString("owner"), r.GetString("icon"))
		}
		if r.GetString("main_muscle") != muscle(t, app, w.main) {
			t.Fatalf("%s: main muscle is not %s", w.name, w.main)
		}
		want := make([]string, len(w.secondary))
		for i, s := range w.secondary {
			want[i] = muscle(t, app, s)
		}
		if got := r.GetStringSlice("secondary_muscles"); strings.Join(got, ",") != strings.Join(want, ",") {
			t.Fatalf("%s: secondary muscles: got %v, want %v", w.name, got, w.secondary)
		}
		if r.GetString("type") != exerciseType(t, app, w.kind) {
			t.Fatalf("%s: type is not %s", w.name, w.kind)
		}
		main, err := app.FindRecordById("muscles", r.GetString("main_muscle"))
		if err != nil {
			t.Fatal(err)
		}
		if main.GetString("category") != category(t, app, w.category) {
			t.Fatalf("%s: lands outside %s", w.name, w.category)
		}
		// Seeded before the validator is bound; held to it all the same.
		if err := app.Validate(r); err != nil {
			t.Fatalf("%s: the seed fails validation: %v", w.name, err)
		}
	}
}

// Stavros's muscles under each category, in order, with the body figure's
// name for each.
var wantMuscles = []struct {
	category string
	muscles  []string
}{
	{"Chest", []string{"Chest"}},
	{"Back", []string{"Lats", "Traps", "Erectors"}},
	{"Biceps", []string{"Biceps"}},
	{"Triceps", []string{"Triceps"}},
	{"Shoulders", []string{"Front delts", "Side delts", "Rear delts"}},
	{"Quads", []string{"Quads"}},
	{"Hamstrings", []string{"Hamstrings"}},
	{"Adductors", []string{"Adductors"}},
	{"Glutes", []string{"Glutes"}},
	{"Calves", []string{"Calves"}},
	{"Abs", []string{"Abs", "Obliques"}},
	{"Forearms", []string{"Forearms"}},
	{"Neck", []string{"Neck"}},
}

func TestMusclesSitUnderTheirCategory(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	total := 0
	for _, w := range wantMuscles {
		got, err := app.FindRecordsByFilter("muscles", "category = {:c}", "position", 0, 0, dbx.Params{"c": category(t, app, w.category)})
		if err != nil {
			t.Fatal(err)
		}
		var names []string
		for _, r := range got {
			names = append(names, r.GetString("name"))
		}
		if strings.Join(names, ",") != strings.Join(w.muscles, ",") {
			t.Errorf("%s: got %v, want %v", w.category, names, w.muscles)
		}
		total += len(names)
	}
	all, _ := app.FindAllRecords("muscles")
	if len(all) != total {
		t.Fatalf("muscles: got %d, want %d", len(all), total)
	}
	front, err := app.FindFirstRecordByFilter("muscles", "name = 'Front delts'")
	if err != nil {
		t.Fatal(err)
	}
	if front.GetString("figure") != "Delts" {
		t.Fatalf("front delts drawn as %q, want Delts", front.GetString("figure"))
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

func muscle(t testing.TB, app core.App, name string) string {
	t.Helper()
	r, err := app.FindFirstRecordByFilter("muscles", "name = {:n}", dbx.Params{"n": name})
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
		"main_muscle":       muscle(t, app, "Chest"),
		"secondary_muscles": []string{muscle(t, app, "Triceps"), muscle(t, app, "Front delts")},
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
			ExpectedContent: []string{`"totalItems":34`, `"name":"Flat Barbell Chest Press"`, `"name":"Wide-Grip Lat Pulldown"`},
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
	r.Set("main_muscle", muscle(t, app, "Lats"))
	r.Set("type", aerobic.Id)
	if err := app.Save(r); err != nil {
		t.Fatalf("an exercise of the new type: %v", err)
	}
}

func TestExerciseShape(t *testing.T) {
	cases := map[string]func(app core.App, r *core.Record){
		"no name":                            func(app core.App, r *core.Record) { r.Set("name", "") },
		"no main muscle":                     func(app core.App, r *core.Record) { r.Set("main_muscle", "") },
		"no type":                            func(app core.App, r *core.Record) { r.Set("type", "") },
		"a main muscle that is not a muscle": func(app core.App, r *core.Record) { r.Set("main_muscle", "nosuchmuscle123") },
		"a category given as the main muscle": func(app core.App, r *core.Record) {
			r.Set("main_muscle", category(t, app, "Chest"))
		},
		"a type that does not exist": func(app core.App, r *core.Record) { r.Set("type", "nosuchtypexxxx1") },
		"the main muscle also secondary": func(app core.App, r *core.Record) {
			r.Set("secondary_muscles", []string{muscle(t, app, "Chest")})
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
			r.Set("main_muscle", muscle(t, app, "Chest"))
			r.Set("secondary_muscles", []string{muscle(t, app, "Triceps")})
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
		"main_muscle": muscle(t, app, "Chest"),
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
	r.Set("main_muscle", muscle(t, app, "Chest"))
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
			ExpectedContent:    []string{`"totalItems":35`},
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

var wantCategoryIcons = map[string]struct {
	icon    string
	muscles []string
	crop    string
}{
	"Chest":      {"bench", []string{"Chest"}, ""},
	"Back":       {"row", []string{"Lats", "Traps", "Erectors"}, ""},
	"Biceps":     {"curl", []string{"Biceps"}, ""},
	"Triceps":    {"pushdown", []string{"Triceps"}, ""},
	"Shoulders":  {"ohp", []string{"Delts", "Side delts", "Rear delts"}, ""},
	"Quads":      {"squat", []string{"Quads"}, ""},
	"Hamstrings": {"rdl", []string{"Hamstrings"}, ""},
	"Adductors":  {"adduction", []string{"Adductors"}, ""},
	"Glutes":     {"hipthrust", []string{"Glutes"}, "116.0 286.0 160.0 160.0"},
	"Calves":     {"calfraise", []string{"Calves"}, ""},
	"Abs":        {"crunch", []string{"Abs", "#21", "#22", "#23", "#24", "#25", "#26"}, ""},
	"Forearms":   {"wristcurl", []string{"Forearms", "Brachialis"}, ""},
	"Neck":       {"row", []string{"#14", "#49", "#50", "#51"}, "131.5 0.0 120.0 120.0"},
}

func TestMuscleCategoriesCarryTheirIcon(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	got, err := app.FindAllRecords("muscle_categories")
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != len(wantCategoryIcons) {
		t.Fatalf("categories: got %d, want %d", len(got), len(wantCategoryIcons))
	}
	for _, r := range got {
		want, ok := wantCategoryIcons[r.GetString("name")]
		if !ok {
			t.Fatalf("unexpected category %q", r.GetString("name"))
		}
		var muscles []string
		if err := json.Unmarshal([]byte(r.GetString("icon_muscles")), &muscles); err != nil {
			t.Fatalf("%s: icon_muscles: %v", r.GetString("name"), err)
		}
		if r.GetString("icon") != want.icon || strings.Join(muscles, ",") != strings.Join(want.muscles, ",") || r.GetString("icon_crop") != want.crop {
			t.Errorf("%s: got %q %v %q, want %q %v %q", r.GetString("name"), r.GetString("icon"), muscles, r.GetString("icon_crop"), want.icon, want.muscles, want.crop)
		}
	}
}
