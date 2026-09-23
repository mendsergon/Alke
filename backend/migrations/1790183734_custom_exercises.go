package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// Custom exercises. A catalog exercise has no owner: everyone reads it and
// only a superuser writes it. A custom exercise is owned by the person who
// made it, and only they read and write it. Making one needs premium; one
// already made stays readable and editable when premium lapses, because only
// the create rule asks. Deleting the person deletes their exercises.
//
// Every exercise has an icon again, custom ones included.
func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		// The create rule reads `subscription_status`. On the live database the
		// field already exists (PLAN.md, Phase 2); a database built from the
		// migrations alone gets the same definition here.
		if users.Fields.GetByName("subscription_status") == nil {
			users.Fields.Add(&core.SelectField{
				Name:      "subscription_status",
				Required:  true,
				MaxSelect: 1,
				Values:    []string{"free", "premium"},
			})
			if err := app.Save(users); err != nil {
				return err
			}
		}

		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		exercises.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
			// Without the cascade, deleting a person would empty this field, and
			// an empty owner means catalog: their exercises would become
			// readable by everyone.
			CascadeDelete: true,
		})
		// The exercise icon set, design pages 30 and 31.
		exercises.Fields.Add(&core.SelectField{Name: "icon", Required: true, MaxSelect: 1, Values: exerciseIcons})
		exercises.AddIndex("idx_exercises_owner", false, "owner", "")

		// Signed in as a person from `users`, and the row is theirs.
		const mine = `@request.auth.id != "" && @request.auth.collectionName = "users" && owner = @request.auth.id`

		exercises.ListRule = types.Pointer(`owner = "" || (` + mine + `)`)
		exercises.ViewRule = types.Pointer(`owner = "" || (` + mine + `)`)
		exercises.CreateRule = types.Pointer(mine + ` && @request.auth.subscription_status = "premium"`)
		exercises.UpdateRule = types.Pointer(mine + ` && @request.body.owner:changed = false`)
		exercises.DeleteRule = types.Pointer(mine)

		return app.Save(exercises)
	}, nil)
}
