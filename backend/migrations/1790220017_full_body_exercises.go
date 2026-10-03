package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The Full Body template's workout, in order, one set each (Stavros,
// 4 October 2026). Only the template is written: a copy someone saved before
// is theirs, and stays as it was saved.
//
// The exercises are found by name in the catalog. A catalog without one of
// them (a fresh data directory, before the catalog is entered) leaves the
// template as it is.
var fullBodyExercises = []struct{ collection, name string }{
	{"weights_chest", "Flat Chest Press"},
	{"weights_shoulders", "Machine Shoulder Press"},
	{"weights_back", "Lat Pulldown"},
	{"weights_back", "Chest Supported Wide Grip Row"},
	{"weights_triceps", "Rope Tricep Extension"},
	{"weights_biceps", "Dumbbell Curl"},
	{"weights_quads", "Leg Press"},
	{"weights_quads", "Leg Extension"},
	{"weights_hamstrings", "Seated Leg Curl"},
	{"weights_calves", "Leg Press Calf Press"},
}

type plannedExercise struct {
	Collection string `json:"collection"`
	Exercise   string `json:"exercise"`
	Sets       int    `json:"sets"`
}

type plannedWorkout struct {
	Name      string            `json:"name"`
	Icon      string            `json:"icon"`
	Exercises []plannedExercise `json:"exercises,omitempty"`
}

type plannedDay struct {
	Weekday  string           `json:"weekday"`
	Workouts []plannedWorkout `json:"workouts"`
}

func init() {
	m.Register(func(app core.App) error {
		template, err := app.FindFirstRecordByFilter("programs", "owner = '' && name = 'Full Body'")
		if err != nil {
			return nil
		}

		planned := make([]plannedExercise, 0, len(fullBodyExercises))
		for _, x := range fullBodyExercises {
			r, err := app.FindFirstRecordByFilter(x.collection, "owner = '' && name = {:name}", dbx.Params{"name": x.name})
			if err != nil {
				return nil
			}
			planned = append(planned, plannedExercise{Collection: x.collection, Exercise: r.Id, Sets: 1})
		}

		var days []plannedDay
		if err := json.Unmarshal([]byte(template.GetString("days")), &days); err != nil {
			return err
		}
		for d := range days {
			for w := range days[d].Workouts {
				// Already planned: written by hand, or by an earlier run.
				if len(days[d].Workouts[w].Exercises) > 0 {
					return nil
				}
				days[d].Workouts[w].Exercises = planned
			}
		}
		template.Set("days", days)
		return app.Save(template)
	}, nil)
}
