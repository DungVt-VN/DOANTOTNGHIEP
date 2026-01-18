import moment from "moment";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
export const formatDate = (date) => {
  return moment(new Date(date)).format("DD/MM/YYYY");
};
export const formatDateFull = (date) => {
  return moment(new Date(date)).format("YYYY-MM-DD HH:mm:ss");
};

export const getText = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent;
};

export const truncateString = (str, maxLength) => {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + "...";
};

export const formattedDateTime = (date) => {
  const dateTime = dayjs(date.$d);
  const formattedDateTime = dateTime.format("YYYY-MM-DD HH:mm:ss");
  return formattedDateTime;
};

export const formatDateString = (dateString) => {
  const originalDate = new Date(dateString);

  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedDateString = originalDate.toLocaleString("en-US", options);

  return formattedDateString;
};
export const generateAccessCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let accessCode = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    accessCode += characters.charAt(randomIndex);
  }

  return accessCode;
};
export const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[i],
    ];
  }
  return shuffledArray;
};

export function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.toString();
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = jwtDecode(token);
    console.log(payload);
    if (!payload?.exp) return false;

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      localStorage.removeItem("token");
      return false;
    }

    return true;
  } catch (error) {
    console.log(error);
    localStorage.removeItem("token");
    return false;
  }
}
