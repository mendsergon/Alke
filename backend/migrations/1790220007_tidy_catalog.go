package migrations

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The catalog as it reads in the dashboard (Stavros, 30 September 2026):
//
//   - An exercise has no icon of its own: the app draws it from its main
//     muscle, with its secondary muscles lit on it.
//   - A category no longer lists its muscles; the muscles collection does.
//   - Related records show by name, not by id, and every field that is not
//     obvious says what it is for.
func init() {
	m.Register(func(app core.App) error {
		exercises, err := app.FindCollectionByNameOrId("exercises")
		if err != nil {
			return err
		}
		exercises.Fields.RemoveByName("icon")
		if err := describe(exercises, map[string]string{
			"name":              "",
			"main_muscle":       "The muscle it trains most. Its category, and the icon it is drawn with, come from this.",
			"secondary_muscles": "The other muscles it trains, drawn lighter on its icon.",
			"type":              "Free weight, cable or machine.",
			"owner":             "Empty: a catalog exercise, which everyone sees. Set: a person's own exercise, which only they see.",
		}); err != nil {
			return err
		}
		if err := app.Save(exercises); err != nil {
			return err
		}

		categories, err := app.FindCollectionByNameOrId("muscle_categories")
		if err != nil {
			return err
		}
		categories.Fields.RemoveByName("muscles")
		if err := describe(categories, map[string]string{
			"name":         "",
			"position":     "Where the category is shown, 1 first.",
			"icon":         "The exercise icon the category's tile is drawn from.",
			"icon_muscles": "The muscles lit on the tile, by the body figure's names; #n names one figure region.",
			"icon_crop":    "The part of the figure the tile shows, as x y width height; empty keeps the icon's own.",
		}); err != nil {
			return err
		}
		if err := app.Save(categories); err != nil {
			return err
		}

		muscles, err := app.FindCollectionByNameOrId("muscles")
		if err != nil {
			return err
		}
		if err := describe(muscles, map[string]string{
			"name":     "",
			"category": "The category the muscle is browsed under.",
			"position": "Where the muscle is shown within its category, 1 first.",
			"figure":   "The body figure's name for the regions this muscle is drawn with.",
		}); err != nil {
			return err
		}
		if err := app.Save(muscles); err != nil {
			return err
		}

		types, err := app.FindCollectionByNameOrId("exercise_types")
		if err != nil {
			return err
		}
		if err := describe(types, map[string]string{
			"name":     "",
			"position": "Where the type is shown, 1 first.",
		}); err != nil {
			return err
		}
		if err := app.Save(types); err != nil {
			return err
		}

		users, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		email, ok := users.Fields.GetByName("email").(*core.EmailField)
		if !ok {
			return fmt.Errorf("users.email is not an email field")
		}
		email.Presentable = true
		return app.Save(users)
	}, nil)
}

// describe marks each collection's "name" as the value shown for its records
// elsewhere in the dashboard, and sets each other field's help text.
func describe(c *core.Collection, help map[string]string) error {
	for name, text := range help {
		switch f := c.Fields.GetByName(name).(type) {
		case *core.TextField:
			if name == "name" {
				f.Presentable = true
			}
			if text != "" {
				f.Help = text
			}
		case *core.RelationField:
			f.Help = text
		case *core.NumberField:
			f.Help = text
		case *core.SelectField:
			f.Help = text
		case *core.JSONField:
			f.Help = text
		default:
			return fmt.Errorf("%s.%s: no help for this field type", c.Name, name)
		}
	}
	return nil
}
