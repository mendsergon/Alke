package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The back exercises' main and secondary muscles as Stavros corrected them
// (26 September 2026), and Inverted Row out of the catalog. Each exercise is
// set from this list whatever it was seeded with, so a fresh database and the
// live one end the same.
func init() {
	m.Register(func(app core.App) error {
		byName := func(collection, name string) (string, error) {
			r, err := app.FindFirstRecordByFilter(collection, "name = {:name}", dbx.Params{"name": name})
			if err != nil {
				return "", fmt.Errorf("%s %q: %w", collection, name, err)
			}
			return r.Id, nil
		}

		inverted, err := app.FindRecordsByFilter("exercises", "owner = '' && name = 'Inverted Row'", "", 0, 0)
		if err != nil {
			return err
		}
		for _, r := range inverted {
			if err := app.Delete(r); err != nil {
				return err
			}
		}

		for _, e := range backCorrected {
			r, err := app.FindFirstRecordByFilter("exercises", "owner = '' && name = {:name}", dbx.Params{"name": e.name})
			if err != nil {
				return fmt.Errorf("%s: %w", e.name, err)
			}
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

var backCorrected = []struct {
	name      string
	main      string
	secondary []string
	kind      string
}{
	{"Wide-Grip Lat Pulldown", "Lats", []string{"Biceps", "Traps"}, "Cable"},
	{"Close-Grip Lat Pulldown", "Lats", []string{"Biceps"}, "Cable"},
	{"Neutral-Grip Machine Pulldown", "Lats", []string{"Biceps"}, "Machine"},
	{"Pull-up", "Lats", []string{"Biceps", "Traps", "Forearms"}, "Free weight"},
	{"Chin-up", "Lats", []string{"Biceps", "Forearms"}, "Free weight"},
	{"Straight-Arm Pulldown", "Lats", []string{"Triceps"}, "Cable"},
	{"Barbell Row", "Traps", []string{"Lats", "Rear delts", "Erectors", "Biceps", "Forearms"}, "Free weight"},
	{"Pendlay Row", "Traps", []string{"Lats", "Rear delts", "Erectors", "Biceps", "Forearms"}, "Free weight"},
	{"Dumbbell Row", "Traps", []string{"Lats", "Biceps", "Forearms"}, "Free weight"},
	{"T-Bar Row", "Traps", []string{"Lats", "Erectors", "Biceps", "Forearms"}, "Free weight"},
	{"Chest-Supported Wide Row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Machine"},
	{"Chest-Supported Close Row", "Lats", []string{"Traps", "Biceps"}, "Machine"},
	{"Close-Grip Seated Cable Row", "Lats", []string{"Traps", "Biceps"}, "Cable"},
	{"Wide-Grip Seated Cable Row", "Traps", []string{"Rear delts", "Lats", "Biceps"}, "Cable"},
	{"Barbell Shrug", "Traps", []string{"Forearms"}, "Free weight"},
	{"Dumbbell Shrug", "Traps", []string{"Forearms"}, "Free weight"},
	{"Smith Shrug", "Traps", nil, "Machine"},
	{"Machine Shrug", "Traps", nil, "Machine"},
}
