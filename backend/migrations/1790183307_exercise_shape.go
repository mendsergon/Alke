package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// An exercise is a name, one main muscle, any number of secondary muscles and
// a type. Muscles are the muscle categories, in their order. Types live in
// their own collection, so adding one — Aerobic, say — is a row there and
// nothing else: no field, no list in code, no migration.
//
// The exercises collection is empty; its first shape (an icon and a list of
// muscles with roles) is replaced.
func init() {
	m.Register(func(app core.App) error {
		kinds := core.NewBaseCollection("exercise_types")
		kinds.ListRule = types.Pointer("")
		kinds.ViewRule = types.Pointer("")
		kinds.Fields.Add(&core.TextField{Name: "name", Required: true})
		// 1-based, the order the types are shown in.
		kinds.Fields.Add(&core.NumberField{Name: "position", Required: true, OnlyInt: true, Min: types.Pointer(1.0)})
		kinds.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		kinds.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
		kinds.AddIndex("idx_exercise_types_name", true, "name", "")
		kinds.AddIndex("idx_exercise_types_position", true, "position", "")
		if err := app.Save(kinds); err != nil {
			return err
		}
		for i, name := range []string{"Free weight", "Cable", "Machine"} {
			r := core.NewRecord(kinds)
			r.Set("name", name)
			r.Set("position", i+1)
			if err := app.Save(r); err != nil {
				return err
			}
		}

		categories, err := app.FindCollectionByNameOrId("muscle_categories")
		if err != nil {
			return err
		}
		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		exercises.Fields.RemoveByName("icon")
		exercises.Fields.RemoveByName("muscles")
		exercises.Fields.Add(&core.RelationField{
			Name:         "main_muscle",
			CollectionId: categories.Id,
			MaxSelect:    1,
			Required:     true,
		})
		exercises.Fields.Add(&core.RelationField{
			Name:         "secondary_muscles",
			CollectionId: categories.Id,
			// Any number: a relation needs a ceiling above 1 to hold several,
			// and this one sits far above the thirteen categories.
			MaxSelect: 99,
		})
		exercises.Fields.Add(&core.RelationField{
			Name:         "type",
			CollectionId: kinds.Id,
			MaxSelect:    1,
			Required:     true,
		})
		return app.Save(exercises)
	}, nil)
}
