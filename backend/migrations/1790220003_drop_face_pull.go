package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Face Pull does not belong in the catalog (Stavros, 26 September 2026).
func init() {
	m.Register(func(app core.App) error {
		records, err := app.FindRecordsByFilter("exercises", "owner = '' && name = 'Face Pull'", "", 0, 0)
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
