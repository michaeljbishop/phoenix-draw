defmodule Draw.CanvasController do
  use Draw.Web, :controller

  alias Draw.Canvas

  def index(conn, _params) do
    canvases = Repo.all(Canvas)
    render(conn, "index.html", canvases: canvases)
  end

  def new(conn, _params) do
    changeset = Canvas.changeset(%Canvas{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"canvas" => canvas_params}) do
    changeset = Canvas.changeset(%Canvas{}, canvas_params)

    case Repo.insert(changeset) do
      {:ok, _canvas} ->
        conn
        |> put_flash(:info, "Canvas created successfully.")
        |> redirect(to: canvas_path(conn, :index))
      {:error, changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    canvas = Repo.get!(Canvas, id)
    render(conn, "show.html", canvas: canvas)
  end

  def edit(conn, %{"id" => id}) do
    canvas = Repo.get!(Canvas, id)
    changeset = Canvas.changeset(canvas)
    render(conn, "edit.html", canvas: canvas, changeset: changeset)
  end

  def update(conn, %{"id" => id, "canvas" => canvas_params}) do
    canvas = Repo.get!(Canvas, id)
    changeset = Canvas.changeset(canvas, canvas_params)

    case Repo.update(changeset) do
      {:ok, canvas} ->
        conn
        |> put_flash(:info, "Canvas updated successfully.")
        |> redirect(to: canvas_path(conn, :show, canvas))
      {:error, changeset} ->
        render(conn, "edit.html", canvas: canvas, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    canvas = Repo.get!(Canvas, id)

    # Here we use delete! (with a bang) because we expect
    # it to always work (and if it does not, it will raise).
    Repo.delete!(canvas)

    conn
    |> put_flash(:info, "Canvas deleted successfully.")
    |> redirect(to: canvas_path(conn, :index))
  end
end
