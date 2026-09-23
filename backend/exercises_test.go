package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

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

func exerciseBody(muscles string) string {
	return `{"name":"Test Press","icon":"bench","muscles":` + muscles + `}`
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
			Body:            strings.NewReader(exerciseBody(`[{"muscle":"Chest","role":"primary"}]`)),
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
	run(t, "an admin adds an exercise with a primary and a secondary muscle", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/exercises/records",
			Headers:         auth(f.adminTok),
			Body:            strings.NewReader(exerciseBody(`[{"muscle":"Chest","role":"primary"},{"muscle":"Triceps","role":"secondary"}]`)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Test Press"`},
		}
	})
}

func TestExerciseShape(t *testing.T) {
	cases := map[string]string{
		"no muscles":              `[]`,
		"a muscle nobody knows":   `[{"muscle":"Wings","role":"primary"}]`,
		"a role that is neither":  `[{"muscle":"Chest","role":"main"}]`,
		"the same muscle twice":   `[{"muscle":"Chest","role":"primary"},{"muscle":"Chest","role":"secondary"}]`,
		"anything but the fields": `[{"muscle":"Chest","role":"primary","sets":2}]`,
	}
	for name, muscles := range cases {
		t.Run(name, func(t *testing.T) {
			app := newProgramsApp(t)
			defer app.Cleanup()

			col, err := app.FindCollectionByNameOrId("exercises")
			if err != nil {
				t.Fatal(err)
			}
			r := core.NewRecord(col)
			r.Set("name", "Test Press")
			r.Set("icon", "bench")
			r.Set("muscles", muscles)
			if err := app.Save(r); err == nil {
				t.Fatal("accepted")
			}
		})
	}

	t.Run("an icon that is not in the set", func(t *testing.T) {
		app := newProgramsApp(t)
		defer app.Cleanup()
		col, _ := app.FindCollectionByNameOrId("exercises")
		r := core.NewRecord(col)
		r.Set("name", "Test Press")
		r.Set("icon", "rocket")
		r.Set("muscles", `[{"muscle":"Chest","role":"primary"}]`)
		if err := app.Save(r); err == nil {
			t.Fatal("accepted")
		}
	})
}
