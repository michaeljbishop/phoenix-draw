defmodule Draw.RoomChannel do
  use Phoenix.Channel

  def join("room:drawing", _message, socket) do
    {:ok, socket}
  end
  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end
  
  def handle_in("drawLine", %{"line" => line} = params, socket) do
    broadcast! socket, "drawLine", %{line: line}
    {:noreply, socket}
  end
end
