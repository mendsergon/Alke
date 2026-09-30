package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Stavros, 30 September 2026:
//
//   - The muscle under the Chest category is the pecs; "Chest" names only the
//     category.
//   - The front delts are drawn with their own regions. They had the body
//     figure's "Delts", which is the front and side heads together, so a
//     secondary front delt lit the side delts too.
//   - Exercises are looked up by main muscle — every category list goes
//     through it — so it is indexed.
func init() {
	m.Register(func(app core.App) error {
		chest, err := app.FindFirstRecordByFilter("muscles", "name = 'Chest'")
		if err != nil {
			return err
		}
		chest.Set("name", "Pecs")
		if err := app.Save(chest); err != nil {
			return err
		}

		front, err := app.FindFirstRecordByFilter("muscles", "name = 'Front delts'")
		if err != nil {
			return err
		}
		front.Set("figure", "Front delts")
		if err := app.Save(front); err != nil {
			return err
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		exercises.AddIndex("idx_exercises_main_muscle", false, "main_muscle", "")
		return app.Save(exercises)
	}, nil)
}
