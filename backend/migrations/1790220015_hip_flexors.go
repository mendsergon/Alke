package migrations

import (
	"slices"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The hip flexors are a muscle under Abs (3 October 2026): Stavros's abs list
// names them as a secondary muscle of the leg raises, and of the thirteen
// categories Abs is the one they sit by. They are also offered as the main
// muscle of an abs exercise. The body figure has no region for them, so no
// icon lights them.
func init() {
	m.Register(func(app core.App) error {
		abs, err := app.FindFirstRecordByFilter("muscle_categories", "name = 'Abs'")
		if err != nil {
			return err
		}
		if _, err := app.FindFirstRecordByFilter("muscles", "name = 'Hip flexors'"); err != nil {
			muscles, err := app.FindCollectionByNameOrId("muscles")
			if err != nil {
				return err
			}
			r := core.NewRecord(muscles)
			r.Set("name", "Hip flexors")
			r.Set("category", abs.Id)
			r.Set("position", 3)
			r.Set("figure", "Hip flexors")
			if err := app.Save(r); err != nil {
				return err
			}
		}

		col, err := app.FindCollectionByNameOrId(WeightsCollection("Abs"))
		if err != nil {
			return err
		}
		choice, ok := col.Fields.GetByName("main_muscle").(*core.SelectField)
		if !ok || slices.Contains(choice.Values, "Hip flexors") {
			return nil
		}
		choice.Values = append(choice.Values, "Hip flexors")
		return app.Save(col)
	}, nil)
}
