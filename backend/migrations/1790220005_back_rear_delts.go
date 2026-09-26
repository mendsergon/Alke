package migrations

import (
	"fmt"
	"slices"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Every back exercise but the shrugs works the rear delts as a secondary
// muscle (Stavros, 26 September 2026). Added after the ones listed, where not
// already there.
func init() {
	m.Register(func(app core.App) error {
		rear, err := app.FindFirstRecordByFilter("muscles", "name = 'Rear delts'")
		if err != nil {
			return err
		}
		for _, e := range backCorrected {
			if strings.HasSuffix(e.name, "Shrug") {
				continue
			}
			r, err := app.FindFirstRecordByFilter("exercises", "owner = '' && name = {:name}", dbx.Params{"name": e.name})
			if err != nil {
				return fmt.Errorf("%s: %w", e.name, err)
			}
			secondary := r.GetStringSlice("secondary_muscles")
			if slices.Contains(secondary, rear.Id) {
				continue
			}
			r.Set("secondary_muscles", append(secondary, rear.Id))
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", e.name, err)
			}
		}
		return nil
	}, nil)
}
