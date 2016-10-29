defmodule Draw.RoomChannel do
  use Phoenix.Channel

  def join("room:drawing", _message, socket) do
    {:ok, socket}
  end
  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
  
  def handle_in("lineStart", %{"canvas_id" => canvas_id, "points" => points}, socket) do
    broadcast! socket, "lineStart", %{canvas_id: canvas_id, points: points}
    {:noreply, socket}
  end
  def handle_in("lineTo", %{"canvas_id" => canvas_id, "points" => points}, socket) do
    broadcast! socket, "lineTo", %{canvas_id: canvas_id, points: points}
    {:noreply, socket}
  end
  def handle_in("lineEnd", %{"canvas_id" => canvas_id, "identifiers" => identifiers}, socket) do
    broadcast! socket, "lineEnd", %{canvas_id: canvas_id, identifiers: identifiers}
    {:noreply, socket}
  end

  # Pages draw locally to their own canvas before sending out draw events so
  # we don't rebroadcast them the event they sent the server.

  intercept ["lineStart", "lineTo", "lineEnd"]

  def handle_out(msg_name, %{canvas_id: canvas_id} = payload, socket) do
    unless canvas_id === socket.assigns.canvas_id,
      do: push socket, msg_name, Map.delete(payload, :canvas_id)
    {:noreply, socket}
  end
end
