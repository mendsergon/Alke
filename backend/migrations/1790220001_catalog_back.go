package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The back exercises, seeded the way the chest ones are, so a fresh database
// has them too. Each lands in the category its main muscle belongs to: Face
// Pull's main muscle is the rear delts, so it is under Shoulders, not Back.
func init() {
	m.Register(func(app core.App) error {
		byName := func(collection, name string) (string, error) {
			r, err := app.FindFirstRecordByFilter(collection, "name = {:name}", dbx.Params{"name": name})
			if err != nil {
				return "", fmt.Errorf("%s %q: %w", collection, name, err)
			}
			return r.Id, nil
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		for _, e := range backExercises {
			main, err := byName("muscles", e.main)
			if err != nil {
				return err
			}
			secondary := make([]string, 0, len(e.secondary))
			for _, s := range e.secondary {
				id, err := byName("muscles", s)
				if err != nil {
					return err
				}
				secondary = append(secondary, id)
			}
			kind, err := byName("exercise_types", e.kind)
			if err != nil {
				return err
			}
			r := core.NewRecord(exercises)
			r.Set("name", e.name)
			// No owner: a catalog exercise.
			r.Set("icon", "row") // the back icon, design page 30
			r.Set("main_muscle", main)
			r.Set("secondary_muscles", secondary)
			r.Set("type", kind)
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", e.name, err)
			}
		}
		return nil
	}, nil)
}

var backExercises = []struct {
	name      string
	main      string
	secondary []string
	kind      string
}{
	{"Wide-Grip Lat Pulldown", "Lats", []string{"Biceps", "Rear delts", "Traps"}, "Cable"},
	{"Close-Grip Lat Pulldown", "Lats", []string{"Biceps"}, "Cable"},
	{"Neutral-Grip Machine Pulldown", "Lats", []string{"Biceps"}, "Machine"},
	{"Pull-up", "Lats", []string{"Biceps", "Traps"}, "Free weight"},
	{"Chin-up", "Lats", []string{"Biceps"}, "Free weight"},
	{"Straight-Arm Pulldown", "Lats", []string{"Triceps"}, "Cable"},
	{"Barbell Row", "Lats", []string{"Traps", "Rear delts", "Biceps"}, "Free weight"},
	{"Pendlay Row", "Lats", []string{"Traps", "Rear delts", "Biceps"}, "Free weight"},
	{"Dumbbell Row", "Lats", []string{"Traps", "Biceps"}, "Free weight"},
	{"T-Bar Row", "Lats", []string{"Traps", "Biceps"}, "Free weight"},
	{"Chest-Supported Wide Row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Machine"},
	{"Chest-Supported Close Row", "Lats", []string{"Traps", "Biceps"}, "Machine"},
	{"Close-Grip Seated Cable Row", "Lats", []string{"Traps", "Biceps"}, "Cable"},
	{"Wide-Grip Seated Cable Row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Cable"},
	{"Inverted Row", "Traps", []string{"Lats", "Biceps"}, "Free weight"},
	{"Face Pull", "Rear delts", []string{"Traps"}, "Cable"},
	{"Barbell Shrug", "Traps", nil, "Free weight"},
	{"Dumbbell Shrug", "Traps", nil, "Free weight"},
	{"Smith Shrug", "Traps", nil, "Machine"},
	{"Machine Shrug", "Traps", nil, "Machine"},
}
