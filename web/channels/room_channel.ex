defmodule Draw.RoomChannel do
  use Phoenix.Channel

  def join("room:drawing", _message, socket) do
    {:ok, socket}
  end
  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
  
  def handle_in("drawLines", %{"lines" => lines}, socket) do
    broadcast! socket, "drawLines", %{lines: lines}
    {:noreply, socket}
  end
end
