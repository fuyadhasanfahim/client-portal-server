import { createClient } from "webdav";
import multer from "multer";
import fs from "fs";
import { Router } from "express";

const router = Router();

const webdav = createClient(
    "https://server.webbriks.com/remote.php/dav/files/administrator/",
    {
        username: "administrator",
        password: "A@02",
    }
);

const upload = multer({ dest: "tmp/" });

router.post("/upload-file", upload.single("file"), async (req, res) => {
    const file = req.file;

    if (!file) {
        res.status(400).send("No file uploaded");
        return;
    }

    const fileStream = fs.createReadStream(file.path);
    const remotePath = `uploads/${file.originalname}`;

    try {
        await webdav.putFileContents(remotePath, fileStream, {
            overwrite: true,
        });
        fs.unlinkSync(file.path);

        const publicURL = `https://server.webbriks.com/remote.php/dav/files/administrator/uploads/${encodeURIComponent(file.originalname)}`;
        res.json({ url: publicURL });
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
});

(async () => {
    try {
        const stream = fs.createReadStream("test.txt");
        await webdav.putFileContents("uploads/test.txt", stream, {
            overwrite: true,
        });
        console.log("✅ Upload success!");
    } catch (err) {
        console.error("❌ Upload failed:", err);
    }
})();

export const uploadRoute = router;
