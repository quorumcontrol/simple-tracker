import parse from "url-parse";
import axios from "axios";

const PORTAL_URI = "https://siasky.net"

export async function upload(file: Blob|File, options = {}) {
    const formData = new FormData();

    formData.append("file", file);

    const parsed = parse(PORTAL_URI);

    parsed.set("pathname", "/skynet/skyfile");

    const { data } = await axios.post(
        parsed.toString(),
        formData,
        //   options.onUploadProgress && {
        //     onUploadProgress: ({ loaded, total }) => {
        //       const progress = loaded / total;

        //       options.onUploadProgress(progress, { loaded, total });
        //     },
        //   }
    );

    return data;
}

export function getUrl(skylink: string, options = {}) {
    const parsed = parse(PORTAL_URI);

    parsed.set("pathname", skylink);

    // if (options.download) {
    //     parsed.set("query", { attachment: true });
    // }

    return parsed.toString();
}
