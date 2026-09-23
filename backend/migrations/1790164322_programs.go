package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// The programs collection and the three templates that ship in it.
//
// A program with no owner is a template: everyone can read it and only a
// superuser can write it. A program with an owner belongs to that person and
// nobody else can read or write it. Saving a template makes a new row owned by
// the person, with the template's schedule and days copied into it, so later
// edits to the template never reach the copy.
//
// The shape of `schedule` and `days` is checked in `backend/programs.go`.
func init() {
	m.Register(func(app core.App) error {
		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		programs := core.NewBaseCollection("programs")

		programs.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
		})
		programs.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: users.Id,
			MaxSelect:    1,
			// Without the cascade, deleting a person would empty this field,
			// and an empty owner means template: their programs would become
			// readable by everyone.
			CascadeDelete: true,
		})
		programs.Fields.Add(&core.JSONField{
			Name:     "schedule",
			Required: true,
		})
		programs.Fields.Add(&core.JSONField{
			Name:     "days",
			Required: true,
		})
		programs.Fields.Add(&core.BoolField{
			Name: "active",
		})
		programs.Fields.Add(&core.AutodateField{
			Name:     "created",
			OnCreate: true,
		})
		programs.Fields.Add(&core.AutodateField{
			Name:     "updated",
			OnCreate: true,
			OnUpdate: true,
		})

		programs.AddIndex("idx_programs_owner", false, "owner", "")
		// A person has one active program at a time.
		programs.AddIndex("idx_programs_one_active", true, "owner", "active = TRUE")

		if err := app.Save(programs); err != nil {
			return err
		}

		// A relation to the collection itself can only be added once the
		// collection exists, and the rules that name it only after that.
		programs.Fields.Add(&core.RelationField{
			Name:         "copied_from",
			CollectionId: programs.Id,
			MaxSelect:    1,
			// Deleting a template leaves the copies made from it.
			CascadeDelete: false,
		})

		// Signed in as a person from `users`, and the row is theirs.
		const mine = `@request.auth.id != "" && @request.auth.collectionName = "users" && owner = @request.auth.id`

		programs.ListRule = types.Pointer(`owner = "" || (` + mine + `)`)
		programs.ViewRule = types.Pointer(`owner = "" || (` + mine + `)`)
		// A new row is the caller's own, and if it is a copy, it is a copy of
		// a template or of one of their own programs.
		programs.CreateRule = types.Pointer(mine + ` && (copied_from = "" || copied_from.owner = "" || copied_from.owner = @request.auth.id)`)
		// Owner and origin are fixed at creation: emptying the owner would turn
		// the row into a template, and changing it would hand it to someone else.
		programs.UpdateRule = types.Pointer(mine + ` && @request.body.owner:changed = false && @request.body.copied_from:changed = false`)
		programs.DeleteRule = types.Pointer(mine)

		if err := app.Save(programs); err != nil {
			return err
		}

		for _, t := range templates {
			r := core.NewRecord(programs)
			r.Set("name", t.name)
			r.Set("schedule", t.schedule)
			r.Set("days", t.days)
			if err := app.Save(r); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		programs, err := app.FindCollectionByNameOrId("programs")
		if err != nil {
			return err
		}
		return app.Delete(programs)
	})
}

type workout struct {
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type day struct {
	Weekday  string    `json:"weekday"`
	Workouts []workout `json:"workouts"`
}

func on(weekday, name, icon string) day {
	return day{Weekday: weekday, Workouts: []workout{{Name: name, Icon: icon}}}
}

// Monday first. Each entry is "training" or "rest", the same every week.
var templates = []struct {
	name     string
	schedule []string
	days     []day
}{
	{
		name:     "Full Body",
		schedule: []string{"training", "rest", "training", "rest", "training", "rest", "rest"},
		days: []day{
			on("monday", "Full body", "full_body"),
			on("wednesday", "Full body", "full_body"),
			on("friday", "Full body", "full_body"),
		},
	},
	{
		name:     "Upper / Lower",
		schedule: []string{"training", "training", "rest", "training", "training", "rest", "rest"},
		days: []day{
			on("monday", "Upper", "upper"),
			on("tuesday", "Lower", "lower"),
			on("thursday", "Upper", "upper"),
			on("friday", "Lower", "lower"),
		},
	},
	{
		name:     "Push / Pull / Lower",
		schedule: []string{"training", "training", "training", "training", "training", "training", "rest"},
		days: []day{
			on("monday", "Push", "push"),
			on("tuesday", "Pull", "pull"),
			on("wednesday", "Lower", "lower"),
			on("thursday", "Push", "push"),
			on("friday", "Pull", "pull"),
			on("saturday", "Lower", "lower"),
		},
	},
}
