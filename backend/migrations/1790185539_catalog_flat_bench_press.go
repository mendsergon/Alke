package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The first catalog exercise, seeded the way the templates are, so a fresh
// database has it too.
//
// Muscles are muscle categories: the front delts it trains are recorded as
// Shoulders, the category that holds them.
func init() {
	m.Register(func(app core.App) error {
		byName := func(collection, name string) (string, error) {
			r, err := app.FindFirstRecordByFilter(collection, "name = {:name}", dbx.Params{"name": name})
			if err != nil {
				return "", err
			}
			return r.Id, nil
		}

		chest, err := byName("muscle_categories", "Chest")
		if err != nil {
			return err
		}
		shoulders, err := byName("muscle_categories", "Shoulders")
		if err != nil {
			return err
		}
		triceps, err := byName("muscle_categories", "Triceps")
		if err != nil {
			return err
		}
		freeWeight, err := byName("exercise_types", "Free weight")
		if err != nil {
			return err
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		r := core.NewRecord(exercises)
		r.Set("name", "Flat Bench Press")
		// No owner: a catalog exercise.
		r.Set("icon", "bench") // the chest icon, design page 30
		r.Set("main_muscle", chest)
		r.Set("secondary_muscles", []string{shoulders, triceps})
		r.Set("type", freeWeight)
		return app.Save(r)
	}, nil)
}
