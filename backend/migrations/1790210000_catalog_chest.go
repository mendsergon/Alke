package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The chest exercises, seeded the way the templates are, so a fresh database
// has them too. Front delts are recorded as Shoulders, the category that holds
// them.
func init() {
	m.Register(func(app core.App) error {
		byName := func(collection, name string) (string, error) {
			r, err := app.FindFirstRecordByFilter(collection, "name = {:name}", dbx.Params{"name": name})
			if err != nil {
				return "", err
			}
			return r.Id, nil
		}

		ids := map[string]string{}
		for _, n := range []struct{ collection, name string }{
			{"muscle_categories", "Chest"},
			{"muscle_categories", "Shoulders"},
			{"muscle_categories", "Triceps"},
			{"exercise_types", "Free weight"},
			{"exercise_types", "Cable"},
			{"exercise_types", "Machine"},
		} {
			id, err := byName(n.collection, n.name)
			if err != nil {
				return err
			}
			ids[n.name] = id
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		for _, e := range chestExercises {
			secondary := make([]string, len(e.secondary))
			for i, s := range e.secondary {
				secondary[i] = ids[s]
			}
			r := core.NewRecord(exercises)
			r.Set("name", e.name)
			// No owner: a catalog exercise.
			r.Set("icon", "bench") // the chest icon, design page 30
			r.Set("main_muscle", ids["Chest"])
			r.Set("secondary_muscles", secondary)
			r.Set("type", ids[e.kind])
			if err := app.Save(r); err != nil {
				return err
			}
		}
		return nil
	}, nil)
}

var chestExercises = []struct {
	name      string
	secondary []string
	kind      string
}{
	{"Flat Barbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Incline Barbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Decline Barbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Flat Dumbbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Incline Dumbbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Decline Dumbbell Chest Press", []string{"Shoulders", "Triceps"}, "Free weight"},
	{"Flat Smith Chest Press", []string{"Shoulders", "Triceps"}, "Machine"},
	{"Incline Smith Chest Press", []string{"Shoulders", "Triceps"}, "Machine"},
	{"Decline Smith Chest Press", []string{"Shoulders", "Triceps"}, "Machine"},
	{"Chest Press Machine", []string{"Shoulders", "Triceps"}, "Machine"},
	{"Dip", []string{"Triceps", "Shoulders"}, "Free weight"},
	{"Push-up", []string{"Triceps", "Shoulders"}, "Free weight"},
	{"Cable Fly", []string{"Shoulders"}, "Cable"},
	{"Pec Deck", []string{"Shoulders"}, "Machine"},
	{"Dumbbell Fly", []string{"Shoulders"}, "Free weight"},
}
