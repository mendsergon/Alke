package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The Full Body template's exercises take two sets each, not one (Stavros,
// 4 October 2026). Only the template: a copy someone saved is theirs. An
// exercise already planned with more than one set is left as it is, so a
// template already changed through the API is not changed again.
func init() {
	m.Register(func(app core.App) error {
		template, err := app.FindFirstRecordByFilter("programs", "owner = '' && name = 'Full Body'")
		if err != nil {
			return nil
		}

		var days []plannedDay
		if err := json.Unmarshal([]byte(template.GetString("days")), &days); err != nil {
			return err
		}
		changed := false
		for d := range days {
			for w := range days[d].Workouts {
				for x := range days[d].Workouts[w].Exercises {
					if days[d].Workouts[w].Exercises[x].Sets < 2 {
						days[d].Workouts[w].Exercises[x].Sets = 2
						changed = true
					}
				}
			}
		}
		if !changed {
			return nil
		}
		template.Set("days", days)
		return app.Save(template)
	}, nil)
}
