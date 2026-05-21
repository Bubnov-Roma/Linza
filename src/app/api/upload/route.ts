// Next.js Route Handler для загрузки файлов в Beget S3.
// Клиент делает POST /api/upload с FormData { file, folder? }
// и получает { url: "https://..." }

import { NextResponse } from "next/server";
import { uploadToS3 } from "@/actions/upload-actions";
import { auth } from "@/auth";

export const maxDuration = 60;

const ALLOWED_IMAGE_MIME = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

const ALLOWED_VIDEO_MIME = new Set([
	"video/mp4",
	"video/webm",
	"video/quicktime", // .mov
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 МБ
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 МБ

export async function POST(req: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await req.formData();
		const file = formData.get("file") as File | null;
		const folder = (formData.get("folder") as string | null) ?? "equipment";

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		const isImage = ALLOWED_IMAGE_MIME.has(file.type);
		const isVideo = ALLOWED_VIDEO_MIME.has(file.type);

		if (!isImage && !isVideo) {
			return NextResponse.json(
				{ error: `Недопустимый тип файла: ${file.type}` },
				{ status: 400 }
			);
		}

		const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
		if (file.size > maxBytes) {
			const limitMb = maxBytes / 1024 / 1024;
			return NextResponse.json(
				{ error: `Файл слишком большой (максимум ${limitMb} МБ)` },
				{ status: 413 }
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const url = await uploadToS3(buffer, file.name, file.type, folder);

		return NextResponse.json({ url });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Ошибка загрузки файла" },
			{ status: 500 }
		);
	}
}
