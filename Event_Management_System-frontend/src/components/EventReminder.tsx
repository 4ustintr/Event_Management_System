import { useEffect, useState } from "react";
import { notification } from "antd";
import dayjs from "dayjs";
import { mockRegisteredEvents } from "../data/mockData";

const EventReminder = () => {
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    // Check for upcoming events every minute
    const checkUpcomingEvents = () => {
      const now = dayjs();
      const upcomingEvents = mockRegisteredEvents.filter((event) => {
        const eventTime = dayjs(event.start_time);
        const timeUntilEvent = eventTime.diff(now, "minute");
        // Show reminder 1 hour before event
        return timeUntilEvent > 0 && timeUntilEvent <= 60;
      });

      upcomingEvents.forEach((event) => {
        if (!reminders.includes(event.id)) {
          notification.info({
            message: "Nhắc nhở sự kiện",
            description: `Sự kiện "${event.title}" sẽ bắt đầu trong 1 giờ tới tại ${event.location}`,
            duration: 10,
          });
          setReminders((prev) => [...prev, event.id]);
        }
      });
    };

    // Initial check
    checkUpcomingEvents();

    // Set up interval to check every minute
    const interval = setInterval(checkUpcomingEvents, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [reminders]);

  return null; // This is a utility component, no UI needed
};

export default EventReminder;
