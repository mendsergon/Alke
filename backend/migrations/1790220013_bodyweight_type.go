package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Bodyweight is an exercise type, after Free weight, Cable and Machine
// (Stavros, 30 September 2026).
func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindFirstRecordByFilter("exercise_types", "name = 'Bodyweight'"); err == nil {
			return nil
		}
		types, err := app.FindCollectionByNameOrId("exercise_types")
		if err != nil {
			return err
		}
		r := core.NewRecord(types)
		r.Set("name", "Bodyweight")
		r.Set("position", 4)
		return app.Save(r)
	}, nil)
}
