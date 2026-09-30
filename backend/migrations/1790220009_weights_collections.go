package migrations

import (
	"fmt"
	"strings"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// Exercises are kept by kind, then by category (Stavros, 30 September 2026):
// weight exercises first, in one collection per muscle category —
// weights_chest, weights_back, … weights_neck. Other kinds of exercise will
// sit beside them under their own prefix.
//
// The single `exercises` collection is emptied into them — each exercise into
// the collection of the category its main muscle belongs to — and removed.
//
// It is written to be applied to a database that already has some or all of
// this: the live one is changed through the API, without a restart, and this
// only has to bring a fresh one to the same place.
func init() {
	m.Register(func(app core.App) error {
		categories, err := app.FindRecordsByFilter("muscle_categories", "", "position", 0, 0)
		if err != nil {
			return err
		}
		muscles, err := app.FindCollectionByNameOrId("muscles")
		if err != nil {
			return err
		}
		kinds, err := app.FindCollectionByNameOrId("exercise_types")
		if err != nil {
			return err
		}
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		for _, c := range categories {
			name := WeightsCollection(c.GetString("name"))
			if _, err := app.FindCollectionByNameOrId(name); err == nil {
				continue
			}
			col := core.NewBaseCollection(name)
			col.Fields.Add(&core.TextField{Name: "name", Required: true, Presentable: true})
			col.Fields.Add(&core.RelationField{
				Name:         "main_muscle",
				CollectionId: muscles.Id,
				MaxSelect:    1,
				Required:     true,
				Help:         fmt.Sprintf("The muscle it trains most, one of %s's. The icon it is drawn with comes from this.", c.GetString("name")),
			})
			col.Fields.Add(&core.RelationField{
				Name:         "secondary_muscles",
				CollectionId: muscles.Id,
				// Any number: a relation needs a ceiling above 1 to hold several.
				MaxSelect: 99,
				Help:      "The other muscles it trains, drawn lighter on its icon.",
			})
			col.Fields.Add(&core.RelationField{
				Name:         "type",
				CollectionId: kinds.Id,
				MaxSelect:    1,
				Required:     true,
				Help:         "Free weight, cable or machine.",
			})
			col.Fields.Add(&core.RelationField{
				Name:         "owner",
				CollectionId: users.Id,
				MaxSelect:    1,
				// Without the cascade, deleting a person would empty this field,
				// and an empty owner means catalog: their exercises would become
				// readable by everyone.
				CascadeDelete: true,
				Help:          "Empty: a catalog exercise, which everyone sees. Set: a person's own exercise, which only they see.",
			})
			col.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
			col.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
			col.AddIndex("idx_"+name+"_owner", false, "owner", "")
			col.AddIndex("idx_"+name+"_main_muscle", false, "main_muscle", "")

			// Signed in as a person from `users`, and the row is theirs. Making
			// one needs premium; one already made stays theirs when it lapses.
			const mine = `@request.auth.id != "" && @request.auth.collectionName = "users" && owner = @request.auth.id`
			col.ListRule = types.Pointer(`owner = "" || (` + mine + `)`)
			col.ViewRule = types.Pointer(`owner = "" || (` + mine + `)`)
			col.CreateRule = types.Pointer(mine + ` && @request.auth.subscription_status = "premium"`)
			col.UpdateRule = types.Pointer(mine + ` && @request.body.owner:changed = false`)
			col.DeleteRule = types.Pointer(mine)
			if err := app.Save(col); err != nil {
				return fmt.Errorf("%s: %w", name, err)
			}
		}

		old, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return nil // already moved
		}
		records, err := app.FindAllRecords(old)
		if err != nil {
			return err
		}
		for _, r := range records {
			main, err := app.FindRecordById("muscles", r.GetString("main_muscle"))
			if err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
			category, err := app.FindRecordById("muscle_categories", main.GetString("category"))
			if err != nil {
				return err
			}
			to, err := app.FindCollectionByNameOrId(WeightsCollection(category.GetString("name")))
			if err != nil {
				return err
			}
			moved := core.NewRecord(to)
			moved.Id = r.Id
			for _, field := range []string{"name", "main_muscle", "secondary_muscles", "type", "owner"} {
				moved.Set(field, r.Get(field))
			}
			if err := app.Save(moved); err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
		}
		return app.Delete(old)
	}, nil)
}

// WeightsCollection names the collection a category's weight exercises live
// in: weights_ and the category's name, lower case, spaces as underscores.
func WeightsCollection(category string) string {
	return "weights_" + strings.ReplaceAll(strings.ToLower(category), " ", "_")
}
