package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// Muscles, a finer level under the muscle categories: each muscle belongs to
// one category. An exercise's main and secondary muscles point at muscles; its
// category is the one its main muscle belongs to, so the library is still
// browsed by category and every exercise lands in exactly one (Stavros, 26
// September 2026).
//
// Each muscle also names the region set the body figure draws it with, which
// is not always its own name: the front delts are "Delts" there.
//
// The exercises already seeded pointed at categories. Each is moved onto the
// muscle its category holds; Shoulders becomes Front delts. A category that
// holds more than one muscle and has no rule here stops the migration rather
// than guess.
func init() {
	m.Register(func(app core.App) error {
		categories, err := app.FindCollectionByNameOrId("muscle_categories")
		if err != nil {
			return err
		}

		muscles := core.NewBaseCollection("muscles")
		muscles.ListRule = types.Pointer("")
		muscles.ViewRule = types.Pointer("")
		muscles.Fields.Add(&core.TextField{Name: "name", Required: true})
		muscles.Fields.Add(&core.RelationField{
			Name:         "category",
			CollectionId: categories.Id,
			MaxSelect:    1,
			Required:     true,
		})
		// 1-based, the order the muscles are shown in within their category.
		muscles.Fields.Add(&core.NumberField{Name: "position", Required: true, OnlyInt: true, Min: types.Pointer(1.0)})
		// The body figure's name for the regions this muscle is drawn with.
		muscles.Fields.Add(&core.TextField{Name: "figure", Required: true})
		muscles.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		muscles.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
		muscles.AddIndex("idx_muscles_name", true, "name", "")
		if err := app.Save(muscles); err != nil {
			return err
		}

		muscleId := map[string]string{}
		for _, c := range muscleList {
			category, err := app.FindFirstRecordByFilter("muscle_categories", "name = {:name}", dbx.Params{"name": c.category})
			if err != nil {
				return fmt.Errorf("category %s: %w", c.category, err)
			}
			for i, mu := range c.muscles {
				r := core.NewRecord(muscles)
				r.Set("name", mu.name)
				r.Set("category", category.Id)
				r.Set("position", i+1)
				r.Set("figure", mu.figure)
				if err := app.Save(r); err != nil {
					return err
				}
				muscleId[mu.name] = r.Id
			}
		}

		// Where each exercise's muscles go, read before the fields change.
		toMuscle := func(categoryId string) (string, error) {
			category, err := app.FindRecordById("muscle_categories", categoryId)
			if err != nil {
				return "", err
			}
			name, ok := categoryMuscle[category.GetString("name")]
			if !ok {
				return "", fmt.Errorf("no rule for moving %s onto one muscle", category.GetString("name"))
			}
			return muscleId[name], nil
		}
		type moved struct {
			main      string
			secondary []string
		}
		plan := map[string]moved{}
		existing, err := app.FindAllRecords("exercises")
		if err != nil {
			return err
		}
		for _, r := range existing {
			main, err := toMuscle(r.GetString("main_muscle"))
			if err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
			var secondary []string
			for _, s := range r.GetStringSlice("secondary_muscles") {
				id, err := toMuscle(s)
				if err != nil {
					return fmt.Errorf("%s: %w", r.GetString("name"), err)
				}
				secondary = append(secondary, id)
			}
			plan[r.Id] = moved{main, secondary}
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		exercises.Fields.RemoveByName("main_muscle")
		exercises.Fields.RemoveByName("secondary_muscles")
		if err := app.Save(exercises); err != nil {
			return err
		}
		exercises.Fields.Add(&core.RelationField{
			Name:         "main_muscle",
			CollectionId: muscles.Id,
			MaxSelect:    1,
			Required:     true,
		})
		exercises.Fields.Add(&core.RelationField{
			Name:         "secondary_muscles",
			CollectionId: muscles.Id,
			// Any number: a relation needs a ceiling above 1 to hold several,
			// and this one sits far above the eighteen muscles.
			MaxSelect: 99,
		})
		if err := app.Save(exercises); err != nil {
			return err
		}

		for id, to := range plan {
			r, err := app.FindRecordById("exercises", id)
			if err != nil {
				return err
			}
			r.Set("main_muscle", to.main)
			r.Set("secondary_muscles", to.secondary)
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
		}
		return nil
	}, nil)
}

// Stavros's list, category by category, in the categories' order.
var muscleList = []struct {
	category string
	muscles  []struct{ name, figure string }
}{
	{"Chest", []struct{ name, figure string }{{"Chest", "Chest"}}},
	{"Back", []struct{ name, figure string }{{"Lats", "Lats"}, {"Traps", "Traps"}, {"Erectors", "Erectors"}}},
	{"Biceps", []struct{ name, figure string }{{"Biceps", "Biceps"}}},
	{"Triceps", []struct{ name, figure string }{{"Triceps", "Triceps"}}},
	{"Shoulders", []struct{ name, figure string }{{"Front delts", "Delts"}, {"Side delts", "Side delts"}, {"Rear delts", "Rear delts"}}},
	{"Quads", []struct{ name, figure string }{{"Quads", "Quads"}}},
	{"Hamstrings", []struct{ name, figure string }{{"Hamstrings", "Hamstrings"}}},
	{"Adductors", []struct{ name, figure string }{{"Adductors", "Adductors"}}},
	{"Glutes", []struct{ name, figure string }{{"Glutes", "Glutes"}}},
	{"Calves", []struct{ name, figure string }{{"Calves", "Calves"}}},
	{"Abs", []struct{ name, figure string }{{"Abs", "Abs"}, {"Obliques", "Obliques"}}},
	{"Forearms", []struct{ name, figure string }{{"Forearms", "Forearms"}}},
	{"Neck", []struct{ name, figure string }{{"Neck", "Neck"}}},
}

// The muscle an exercise already pointing at a category moves onto. Shoulders
// means the front delts (Stavros, 26 September 2026); Back and Abs hold more
// than one muscle and have no rule.
var categoryMuscle = map[string]string{
	"Chest":      "Chest",
	"Biceps":     "Biceps",
	"Triceps":    "Triceps",
	"Shoulders":  "Front delts",
	"Quads":      "Quads",
	"Hamstrings": "Hamstrings",
	"Adductors":  "Adductors",
	"Glutes":     "Glutes",
	"Calves":     "Calves",
	"Forearms":   "Forearms",
	"Neck":       "Neck",
}
