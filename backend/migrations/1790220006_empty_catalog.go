package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The catalog is emptied until the full exercise list comes in (Stavros, 29
// September 2026). Only catalog exercises go; a person's own stay.
func init() {
	m.Register(func(app core.App) error {
		records, err := app.FindRecordsByFilter("exercises", "owner = ''", "", 0, 0)
		if err != nil {
			return err
		}
		for _, r := range records {
			if err := app.Delete(r); err != nil {
				return err
			}
		}
		return nil
	}, nil)
}
