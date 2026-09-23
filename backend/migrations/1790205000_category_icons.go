package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		categories, err := app.FindCollectionByNameOrId("muscle_categories")
		if err != nil {
			return err
		}
		categories.Fields.Add(&core.SelectField{Name: "icon", Required: true, MaxSelect: 1, Values: exerciseIcons})
		categories.Fields.Add(&core.JSONField{Name: "icon_muscles", Required: true})
		categories.Fields.Add(&core.TextField{Name: "icon_crop"})
		if err := app.Save(categories); err != nil {
			return err
		}

		for _, c := range []struct {
			name    string
			icon    string
			muscles []string
			crop    string
		}{
			{"Chest", "bench", []string{"Chest"}, ""},
			{"Back", "row", []string{"Lats", "Traps", "Erectors"}, ""},
			{"Biceps", "curl", []string{"Biceps"}, ""},
			{"Triceps", "pushdown", []string{"Triceps"}, ""},
			{"Shoulders", "ohp", []string{"Delts", "Side delts", "Rear delts"}, ""},
			{"Quads", "squat", []string{"Quads"}, ""},
			{"Hamstrings", "rdl", []string{"Hamstrings"}, ""},
			{"Adductors", "adduction", []string{"Adductors"}, ""},
			{"Glutes", "hipthrust", []string{"Glutes"}, "116.0 286.0 160.0 160.0"},
			{"Calves", "calfraise", []string{"Calves"}, ""},
			{"Abs", "crunch", []string{"Abs", "#21", "#22", "#23", "#24", "#25", "#26"}, ""},
			{"Forearms", "wristcurl", []string{"Forearms", "Brachialis"}, ""},
			{"Neck", "row", []string{"#14", "#49", "#50", "#51"}, "131.5 0.0 120.0 120.0"},
		} {
			r, err := app.FindFirstRecordByFilter("muscle_categories", "name = {:name}", dbx.Params{"name": c.name})
			if err != nil {
				return err
			}
			r.Set("icon", c.icon)
			r.Set("icon_muscles", c.muscles)
			r.Set("icon_crop", c.crop)
			if err := app.Save(r); err != nil {
				return err
			}
		}
		return nil
	}, func(app core.App) error {
		categories, err := app.FindCollectionByNameOrId("muscle_categories")
		if err != nil {
			return err
		}
		categories.Fields.RemoveByName("icon")
		categories.Fields.RemoveByName("icon_muscles")
		categories.Fields.RemoveByName("icon_crop")
		return app.Save(categories)
	})
}
