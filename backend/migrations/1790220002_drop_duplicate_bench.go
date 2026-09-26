package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// "Flat Bench Press" and "Incline Bench Press" are the same exercises as
// "Flat Barbell Chest Press" and "Incline Barbell Chest Press", left over from
// before the naming convention (Stavros, 26 September 2026). The catalog keeps
// the new names. Only catalog records go; a database without one of them —
// a fresh one never had "Incline Bench Press" — has nothing to delete.
func init() {
	m.Register(func(app core.App) error {
		for _, name := range []string{"Flat Bench Press", "Incline Bench Press"} {
			records, err := app.FindRecordsByFilter("exercises", "owner = '' && name = {:name}", "", 0, 0, dbx.Params{"name": name})
			if err != nil {
				return err
			}
			for _, r := range records {
				if err := app.Delete(r); err != nil {
					return err
				}
			}
		}
		return nil
	}, nil)
}
