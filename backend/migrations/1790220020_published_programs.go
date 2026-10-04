package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

// A person can publish a program of their own (Stavros, 4 October 2026):
// published, everyone signed in can read it and duplicate it as their own
// copy, and only its owner can change it, unpublish it or delete it.
func init() {
	m.Register(func(app core.App) error {
		programs, err := app.FindCollectionByNameOrId("programs")
		if err != nil {
			return err
		}
		if programs.Fields.GetByName("published") == nil {
			programs.Fields.Add(&core.BoolField{Name: "published"})
		}

		const signedIn = `@request.auth.id != "" && @request.auth.collectionName = "users"`
		const mine = signedIn + ` && owner = @request.auth.id`

		// Templates for everyone; the person's own; and what others published,
		// for anyone signed in.
		read := `owner = "" || (` + mine + `) || (` + signedIn + ` && published = true)`
		programs.ListRule = types.Pointer(read)
		programs.ViewRule = types.Pointer(read)
		// A copy is of a template, of one of the person's own programs, or of
		// a program someone published.
		programs.CreateRule = types.Pointer(mine + ` && (copied_from = "" || copied_from.owner = "" || copied_from.owner = @request.auth.id || copied_from.published = true)`)
		return app.Save(programs)
	}, nil)
}
