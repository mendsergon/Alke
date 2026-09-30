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

// The thirteen muscle categories in Stavros's order. The muscles under each
// are in the muscles collection.
var wantCategories = []string{
	"Chest", "Back", "Biceps", "Triceps", "Shoulders", "Quads", "Hamstrings",
	"Adductors", "Glutes", "Calves", "Abs", "Forearms", "Neck",
}

func TestMuscleCategoriesAreSeededInOrder(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	got, err := app.FindRecordsByFilter("muscle_categories", "", "position", 0, 0)
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, r := range got {
		names = append(names, r.GetString("name"))
	}
	if strings.Join(names, ",") != strings.Join(wantCategories, ",") {
		t.Fatalf("categories: got %v, want %v", names, wantCategories)
	}
}

// An exercise has no icon of its own and a category no list of muscles; the
// dashboard shows related records by name.
func TestTheCatalogReadsPlainly(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	if _, err := app.FindCollectionByNameOrId("exercises"); err == nil {
		t.Fatal("the single exercises collection is still there")
	}
	exercises, _ := app.FindCollectionByNameOrId("weights_chest")
	if exercises.Fields.GetByName("icon") != nil {
		t.Fatal("exercises still carry an icon field")
	}
	if exercises.Fields.GetByName("owner").(*core.RelationField).Help == "" {
		t.Fatal("owner does not say what it is for")
	}
	categories, _ := app.FindCollectionByNameOrId("muscle_categories")
	if categories.Fields.GetByName("muscles") != nil {
		t.Fatal("categories still list their muscles")
	}
	for _, name := range []string{"weights_chest", "muscle_categories", "muscles", "exercise_types"} {
		c, _ := app.FindCollectionByNameOrId(name)
		if !c.Fields.GetByName("name").(*core.TextField).Presentable {
			t.Errorf("%s: name is not shown for its records", name)
		}
	}
	users, _ := app.FindCollectionByNameOrId("users")
	if !users.Fields.GetByName("email").(*core.EmailField).Presentable {
		t.Error("users: email is not shown for their records")
	}
}

// The catalog is empty until the full exercise list comes in; the seeded
// chest and back exercises are gone.
func TestTheCatalogIsEmpty(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	for _, c := range wantCategories {
		all, err := app.FindRecordsByFilter(weights(c), "owner = ''", "", 0, 0)
		if err != nil {
			t.Fatalf("%s: %v", weights(c), err)
		}
		if len(all) != 0 {
			t.Fatalf("%s: got %d catalog exercises, want none", weights(c), len(all))
		}
	}
}

// Weight exercises are kept one collection per category, in the categories'
// order: weights_chest, weights_back, … weights_neck.
func weights(category string) string {
	return "weights_" + strings.ReplaceAll(strings.ToLower(category), " ", "_")
}

func TestEachCategoryHasItsWeightsCollection(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	for _, c := range wantCategories {
		col, err := app.FindCollectionByNameOrId(weights(c))
		if err != nil {
			t.Fatalf("%s: %v", weights(c), err)
		}
		for _, f := range []string{"name", "secondary_muscles", "type", "owner"} {
			if col.Fields.GetByName(f) == nil {
				t.Errorf("%s has no %s", weights(c), f)
			}
		}
	}
}

// The main muscle is picked only from the category's own muscles; a category
// with one muscle has nothing to pick.
func TestTheMainMuscleIsTheCategorysOwn(t *testing.T) {
	app := newProgramsApp(t)
	defer app.Cleanup()

	for _, w := range wantMuscles {
		col, _ := app.FindCollectionByNameOrId(weights(w.category))
		f := col.Fields.GetByName("main_muscle")
		if len(w.muscles) == 1 {
			if f != nil {
				t.Errorf("%s: a main muscle to pick, with only %s to pick", col.Name, w.muscles[0])
			}
			continue
		}
		choice, ok := f.(*core.SelectField)
		if !ok {
			t.Errorf("%s: main_muscle is not a choice of its muscles", col.Name)
			continue
		}
		if strings.Join(choice.Values, ",") != strings.Join(w.muscles, ",") || !choice.Required || choice.MaxSelect != 1 {
			t.Errorf("%s: main_muscle offers %v, want exactly one of %v", col.Name, choice.Values, w.muscles)
		}
	}

	col, _ := app.FindCollectionByNameOrId("weights_back")
	r := core.NewRecord(col)
	r.Set("name", "Lat Pulldown")
	r.Set("main_muscle", "Pecs")
	r.Set("type", exerciseType(t, app, "Cable"))
	if err := app.Save(r); err == nil {
		t.Fatal("Pecs was taken as the main muscle of a back exercise")
	}
}

// Stavros's muscles under each category, in order, with the body figure's
// name for each.
var wantMuscles = []struct {
	category string
	muscles  []string
}{
	{"Chest", []string{"Pecs"}},
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
	{"Forearms", []string{"Forearm extensors", "Forearm flexors", "Brachialis"}},
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
	if front.GetString("figure") != "Front delts" {
		t.Fatalf("front delts drawn as %q, want Front delts", front.GetString("figure"))
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
			URL:             "/api/collections/weights_chest/records",
			ExpectedStatus:  200,
			ExpectedContent: []string{`"totalItems":0`},
		}
	})
	run(t, "a free user cannot add a catalog exercise", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/weights_chest/records",
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
			URL:             "/api/collections/weights_chest/records",
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

	col, _ := app.FindCollectionByNameOrId("weights_back")
	r := core.NewRecord(col)
	r.Set("name", "Rowing Machine")
	r.Set("main_muscle", "Lats")
	r.Set("type", aerobic.Id)
	if err := app.Save(r); err != nil {
		t.Fatalf("an exercise of the new type: %v", err)
	}
}

func TestExerciseShape(t *testing.T) {
	cases := map[string]struct {
		collection string
		spoil      func(app core.App, r *core.Record)
	}{
		"no name":                    {"weights_chest", func(app core.App, r *core.Record) { r.Set("name", "") }},
		"no type":                    {"weights_chest", func(app core.App, r *core.Record) { r.Set("type", "") }},
		"a type that does not exist": {"weights_chest", func(app core.App, r *core.Record) { r.Set("type", "nosuchtypexxxx1") }},
		"a secondary that is not a muscle": {"weights_chest", func(app core.App, r *core.Record) {
			r.Set("secondary_muscles", []string{"nosuchmuscle123"})
		}},
		"the category's only muscle also secondary": {"weights_chest", func(app core.App, r *core.Record) {
			r.Set("secondary_muscles", []string{muscle(t, app, "Pecs")})
		}},
		"no main muscle":                    {"weights_back", func(app core.App, r *core.Record) { r.Set("main_muscle", "") }},
		"a main muscle of another category": {"weights_back", func(app core.App, r *core.Record) { r.Set("main_muscle", "Pecs") }},
		"the chosen main muscle also secondary": {"weights_back", func(app core.App, r *core.Record) {
			r.Set("secondary_muscles", []string{muscle(t, app, "Lats")})
		}},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			app := newProgramsApp(t)
			defer app.Cleanup()

			col, _ := app.FindCollectionByNameOrId(c.collection)
			r := core.NewRecord(col)
			r.Set("name", "Test Lift")
			if col.Fields.GetByName("main_muscle") != nil {
				r.Set("main_muscle", "Lats")
			}
			r.Set("secondary_muscles", []string{muscle(t, app, "Triceps")})
			r.Set("type", exerciseType(t, app, "Free weight"))
			if err := app.Save(r); err != nil {
				t.Fatalf("the valid exercise was refused: %v", err)
			}
			c.spoil(app, r)
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
		"name":  "My Press",
		"owner": owner,
		"type":  exerciseType(t, app, "Cable"),
	})
	return string(b)
}

// saveExercise writes an exercise directly, as an admin would.
func saveExercise(t testing.TB, app core.App, owner string) *core.Record {
	t.Helper()
	col, _ := app.FindCollectionByNameOrId("weights_chest")
	r := core.NewRecord(col)
	r.Set("name", "Stored Press")
	r.Set("owner", owner)
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
			URL:             "/api/collections/weights_chest/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, f.alice.Id)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"owner":"` + f.alice.Id + `"`},
		}
	})
	run(t, "a free user cannot create one", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/weights_chest/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(customBody(t, f.app, f.alice.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a guest cannot create one", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/weights_chest/records",
			Body:            strings.NewReader(customBody(t, f.app, "")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a premium user cannot create a catalog exercise", func(f *fixture) tests.ApiScenario {
		setPremium(t, f.app, f.alice, true)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/weights_chest/records",
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
			URL:             "/api/collections/weights_chest/records",
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
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{mine.Id},
		}
	})
	run(t, "another user cannot open it", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:                "/api/collections/weights_chest/records",
			Headers:            auth(f.aliceTok),
			ExpectedStatus:     200,
			ExpectedContent:    []string{`"totalItems":1`},
			NotExpectedContent: []string{mine.Id},
		}
	})
	run(t, "the owner edits their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:             "/api/collections/weights_chest/records/" + catalog.Id,
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
			URL:             "/api/collections/weights_chest/records/" + catalog.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a guest cannot edit a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/weights_chest/records/" + catalog.Id,
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a guest cannot delete a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/weights_chest/records/" + catalog.Id,
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "an admin edits a catalog exercise", func(f *fixture) tests.ApiScenario {
		catalog := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/weights_chest/records/" + catalog.Id,
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
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
			Headers:         auth(f.bobTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{mine.Id},
		}
	})
	run(t, "a lapsed user still edits their exercise", func(f *fixture) tests.ApiScenario {
		mine := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/weights_chest/records/" + mine.Id,
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
			URL:             "/api/collections/weights_chest/records",
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
	if _, err := f.app.FindRecordById("weights_chest", mine.Id); err == nil {
		t.Fatal("the deleted user's exercise is still there")
	}
	if _, err := f.app.FindRecordById("weights_chest", catalog.Id); err != nil {
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
