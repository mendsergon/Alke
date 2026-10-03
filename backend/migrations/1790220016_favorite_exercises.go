package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// A person's favorite exercises (Stavros, 3 October 2026): the star on an
// exercise. Exercises live in one collection per category, so a favorite
// names the collection and the exercise's id rather than relating to one
// collection. Each person sees and changes only their own, and an exercise is
// a favorite once.
func init() {
	m.Register(func(app core.App) error {
		if _, err := app.FindCollectionByNameOrId("favorite_exercises"); err == nil {
			return nil
		}
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		col := core.NewBaseCollection("favorite_exercises")
		col.Fields.Add(&core.RelationField{
			Name:          "user",
			CollectionId:  users.Id,
			MaxSelect:     1,
			Required:      true,
			CascadeDelete: true,
			Help:          "Whose favorite it is.",
		})
		col.Fields.Add(&core.TextField{
			Name:     "collection",
			Required: true,
			Pattern:  `^weights_[a-z_]+$`,
			Help:     "The collection the exercise is in: weights_chest, weights_back, …",
		})
		col.Fields.Add(&core.TextField{
			Name:     "exercise",
			Required: true,
			Help:     "The exercise's id in that collection.",
		})
		col.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
		col.AddIndex("idx_favorite_exercises_once", true, "user, collection, exercise", "")

		const mine = `@request.auth.id != "" && @request.auth.collectionName = "users" && user = @request.auth.id`
		col.ListRule = types.Pointer(mine)
		col.ViewRule = types.Pointer(mine)
		col.CreateRule = types.Pointer(`@request.auth.id != "" && @request.auth.collectionName = "users" && @request.body.user = @request.auth.id`)
		col.DeleteRule = types.Pointer(mine)
		return app.Save(col)
	}, nil)
}
