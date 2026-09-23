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

func TestNoExercisesAreSeeded(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	n, err := app.CountRecords("exercises")
	if err != nil {
		t.Fatal(err)
	}
	if n != 0 {
		t.Fatalf("exercises: got %d, want 0", n)
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
			ExpectedContent: []string{`"totalItems":0`},
		}
	})
	run(t, "a user cannot add an exercise", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(exerciseBody(t, f.app)),
			ExpectedStatus:  403,
			ExpectedContent: []string{`"status":403`},
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
