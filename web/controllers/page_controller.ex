defmodule Draw.PageController do
  use Draw.Web, :controller

  def index(conn, _params) do
    # Render the homepage with only something simple. No app layout.
    conn
    |> put_layout(false)
    |> render("index.html")
  end
end
