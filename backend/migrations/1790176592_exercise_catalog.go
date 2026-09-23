package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// The exercise catalog: the muscle categories, in Stavros's order, and the
// exercises, which are grouped by them. Both are read by everyone and written
// only by a superuser.
func init() {
	m.Register(func(app core.App) error {
		categories := core.NewBaseCollection("muscle_categories")
		categories.ListRule = types.Pointer("")
		categories.ViewRule = types.Pointer("")
		categories.Fields.Add(&core.TextField{Name: "name", Required: true})
		// 1-based, the order the categories are shown in.
		categories.Fields.Add(&core.NumberField{Name: "position", Required: true, OnlyInt: true, Min: types.Pointer(1.0)})
		// The muscles the category covers, by the names the body figure uses.
		categories.Fields.Add(&core.JSONField{Name: "muscles", Required: true})
		categories.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		categories.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
		categories.AddIndex("idx_muscle_categories_name", true, "name", "")
		categories.AddIndex("idx_muscle_categories_position", true, "position", "")
		if err := app.Save(categories); err != nil {
			return err
		}

		for i, c := range muscleCategories {
			r := core.NewRecord(categories)
			r.Set("name", c.name)
			r.Set("position", i+1)
			r.Set("muscles", c.muscles)
			if err := app.Save(r); err != nil {
				return err
			}
		}

		exercises := core.NewBaseCollection("exercises")
		exercises.ListRule = types.Pointer("")
		exercises.ViewRule = types.Pointer("")
		exercises.Fields.Add(&core.TextField{Name: "name", Required: true})
		// The exercise icon set, design pages 30 and 31.
		exercises.Fields.Add(&core.SelectField{Name: "icon", Required: true, MaxSelect: 1, Values: exerciseIcons})
		// [{"muscle": "Chest", "role": "primary"}, ...]: every muscle it trains,
		// each primary or secondary for this exercise.
		exercises.Fields.Add(&core.JSONField{Name: "muscles", Required: true})
		exercises.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		exercises.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
		return app.Save(exercises)
	}, func(app core.App) error {
		for _, name := range []string{"exercises", "muscle_categories"} {
			c, err := app.FindCollectionByNameOrId(name)
			if err != nil {
				return err
			}
			if err := app.Delete(c); err != nil {
				return err
			}
		}
		return nil
	})
}

// Stavros's order. Rear delts go
// with the other delt heads.
var muscleCategories = []struct {
	name    string
	muscles []string
}{
	{"Chest", []string{"Chest"}},
	{"Back", []string{"Lats", "Traps", "Erectors"}},
	{"Biceps", []string{"Biceps"}},
	{"Triceps", []string{"Triceps"}},
	{"Shoulders", []string{"Delts", "Side delts", "Rear delts"}},
	{"Quads", []string{"Quads"}},
	{"Hamstrings", []string{"Hamstrings"}},
	{"Adductors", []string{"Adductors"}},
	{"Glutes", []string{"Glutes"}},
	{"Calves", []string{"Calves"}},
	{"Abs", []string{"Abs", "Obliques"}},
	{"Forearms", []string{"Forearms", "Brachialis"}},
	{"Neck", []string{"Neck"}},
}

// The keys of the exercise icon set, as `apps/mobile/src/figure/figure.generated.ts` names them.
var exerciseIcons = []string{
	"adduction", "backext", "bench", "calfraise", "crunch", "curl", "facepull",
	"hammer", "hipthrust", "lateral", "neckcurl", "ohp", "pallof", "pushdown",
	"rdl", "row", "shrug", "squat", "wristcurl",
}
