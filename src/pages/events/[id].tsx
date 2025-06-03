import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button, Card, message } from "antd";
import { mockEvents, mockRegisteredEvents } from "../../data/mockData";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";

const EventDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { userRole, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning("Vui lòng đăng nhập để xem chi tiết sự kiện");
      router.replace({
        pathname: "/login",
        query: { returnUrl: `/events/${id}` },
      });
      return;
    }

    if (id) {
      const foundEvent = mockEvents.find((e) => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
        // Check if user has registered for this event
        const registeredEvent = mockRegisteredEvents.find((e) => e.id === id);
        setIsRegistered(!!registeredEvent);
      } else {
        message.error("Không tìm thấy sự kiện");
        router.replace("/events");
      }
    }
  }, [id, router, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (!event) {
    return null;
  }

  const handleRegister = () => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để đăng ký sự kiện");
      router.push("/login");
      return;
    }

    if (userRole !== "student") {
      message.error("Chỉ sinh viên mới có thể đăng ký sự kiện");
      return;
    }

    // Add registration logic here
    message.success("Đăng ký thành công!");
    setIsRegistered(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Event Banner */}
      <div className="relative h-96 w-full">
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white text-center px-4">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Time and Registration */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-2">
              <p className="text-lg">
                <strong>Thời gian:</strong>{" "}
                {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")} -{" "}
                {dayjs(event.end_time).format("HH:mm DD/MM/YYYY")}
              </p>
              <p className="text-lg">
                <strong>Địa điểm:</strong> {event.location}
              </p>
              <p className="text-lg">
                <strong>Số lượng đã đăng ký:</strong> {event.registered_count}/
                {event.max_participants}
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleRegister}
              disabled={
                isRegistered || event.registered_count >= event.max_participants
              }
            >
              {isRegistered
                ? "Đã đăng ký"
                : event.registered_count >= event.max_participants
                ? "Đã hết chỗ"
                : "Đăng ký tham gia"}
            </Button>
          </div>
        </Card>

        {/* Event Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card title="Thông tin sự kiện" className="mb-8">
              <div className="prose max-w-none">
                <p className="text-lg">{event.description}</p>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Thể loại</h3>
                  <p>{event.category}</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Trạng thái</h3>
                  <p>{event.status}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Organizer Information */}
          <div>
            <Card title="Thông tin tổ chức" className="mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Tên câu lạc bộ</h3>
                    <p className="text-gray-600">CLB Công nghệ</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong>Email:</strong> contact@club.com
                  </p>
                  <p>
                    <strong>Điện thoại:</strong> 0123456789
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
