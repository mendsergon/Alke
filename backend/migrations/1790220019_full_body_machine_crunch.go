package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Machine Crunch closes the Full Body template's workout, two sets like the
// rest (Stavros, 4 October 2026). Only the template; a workout that already
// plans it is left as it is, so a template already changed through the API is
// not changed again. A catalog without it leaves the template alone.
func init() {
	m.Register(func(app core.App) error {
		template, err := app.FindFirstRecordByFilter("programs", "owner = '' && name = 'Full Body'")
		if err != nil {
			return nil
		}
		crunch, err := app.FindFirstRecordByFilter("weights_abs", "owner = '' && name = 'Machine Crunch'")
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
				exercises := days[d].Workouts[w].Exercises
				if len(exercises) == 0 {
					continue
				}
				planned := false
				for _, x := range exercises {
					if x.Collection == "weights_abs" && x.Exercise == crunch.Id {
						planned = true
					}
				}
				if !planned {
					days[d].Workouts[w].Exercises = append(exercises, plannedExercise{Collection: "weights_abs", Exercise: crunch.Id, Sets: 2})
					changed = true
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
