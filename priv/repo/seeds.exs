# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Draw.Repo.insert!(%Draw.SomeModel{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

Draw.Repo.insert!(%Draw.Canvas{title: "Spider Man"})
Draw.Repo.insert!(%Draw.Canvas{title: "Sad Frog"})
