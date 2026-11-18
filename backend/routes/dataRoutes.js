import express from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import path from "path";

import Data from "../models/Data.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();


//store uploaded files in memory while we process them
const upload = multer({
    storage: multer.memoryStorage(),

    //limit uploaded files to 5 MB for now
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});


//these are the columns our CSV file is expected to contain
const requiredColumns = [
    "organization_ID",
    "term_code",
    "activity_date",
    "unit_code",
    "activity_type",
    "event_name",
    "quantity",
    "level",
    "class_standing",
    "enrollment_status",
    "race",
    "gender",
    "pell_eligible",
    "first_gen",
    "transfer",
    "housing",
    "college",
];


//convert values such as TRUE/FALSE from the CSV into JavaScript booleans
const convertBoolean = (value) => {

    if (value === undefined || value === null || value === "") {
        return false;
    }

    const normalizedValue = String(value).trim().toLowerCase();

    if (normalizedValue === "true" || normalizedValue === "1" || normalizedValue === "yes") {
        return true;
    }

    if (normalizedValue === "false" || normalizedValue === "0" || normalizedValue === "no") {
        return false;
    }

    throw new Error(`Invalid boolean value: ${value}`);
};


//read the CSV file and turn it into JavaScript objects
const parseCSV = (buffer) => {

    return new Promise((resolve, reject) => {

        const rows = [];
        let headers = [];

        Readable.from(buffer)
            .pipe(
                csv({
                    mapHeaders: ({ header }) => header.trim(),
                })
            )

            .on("headers", (csvHeaders) => {
                headers = csvHeaders;
            })

            .on("data", (row) => {
                rows.push(row);
            })

            .on("end", () => {
                resolve({
                    headers,
                    rows,
                });
            })

            .on("error", (error) => {
                reject(error);
            });
    });
};


//upload a data file
router.post(
    "/upload",
    protectRoute,
    upload.single("file"),

    async (req, res) => {

        try {

            //make sure a file was actually uploaded
            if (!req.file) {
                return res.status(400).json({
                    message: "No file was uploaded",
                });
            }


            //make sure the logged in user belongs to an organization
            if (!req.user.organization) {
                return res.status(400).json({
                    message: "User is not associated with an organization",
                });
            }


            //check the file extension
            const fileExtension = path
                .extname(req.file.originalname)
                .toLowerCase();

            if (fileExtension !== ".csv") {
                return res.status(400).json({
                    message: "Only CSV files are currently supported",
                });
            }


            //read the CSV
            const { headers, rows } = await parseCSV(req.file.buffer);


            //make sure the file contains data
            if (rows.length === 0) {
                return res.status(400).json({
                    message: "The uploaded CSV file contains no data",
                });
            }


            //check that all expected columns exist
            const missingColumns = requiredColumns.filter(
                (column) => !headers.includes(column)
            );

            if (missingColumns.length > 0) {
                return res.status(400).json({
                    message: "CSV file is missing required columns",
                    missingColumns,
                });
            }


            const records = [];


            //validate and convert every CSV row
            for (let i = 0; i < rows.length; i++) {

                const row = rows[i];

                //required basic fields
                if (
                    !row.term_code ||
                    !row.activity_date ||
                    !row.unit_code ||
                    !row.activity_type ||
                    !row.event_name
                ) {
                    return res.status(400).json({
                        message: `Missing required data in row ${i + 2}`,
                    });
                }


                //validate the activity date
                const activityDate = new Date(row.activity_date);

                if (Number.isNaN(activityDate.getTime())) {
                    return res.status(400).json({
                        message: `Invalid activity_date in row ${i + 2}`,
                    });
                }


                //validate quantity
                const quantity =
                    row.quantity === ""
                        ? 0
                        : Number(row.quantity);

                if (!Number.isInteger(quantity) || quantity < 0) {
                    return res.status(400).json({
                        message: `Invalid quantity in row ${i + 2}`,
                    });
                }


                const record = {

                    /*
                    Do NOT trust organization_ID from the CSV for ownership.

                    The authenticated user's organization determines
                    which organization owns this data.
                    */
                    organization: req.user.organization,

                    uploadedBy: req.user._id,

                    fileName: req.file.originalname,

                    fileType: "csv",

                    term_code: row.term_code.trim(),

                    activity_date: activityDate,

                    unit_code: row.unit_code.trim(),

                    activity_type: row.activity_type.trim(),

                    event_name: row.event_name.trim(),

                    quantity: quantity,

                    level: row.level?.trim(),

                    class_standing: row.class_standing?.trim(),

                    enrollment_status: row.enrollment_status?.trim(),

                    race: row.race?.trim(),

                    gender: row.gender?.trim(),

                    pell_eligible: convertBoolean(row.pell_eligible),

                    first_gen: convertBoolean(row.first_gen),

                    transfer: convertBoolean(row.transfer),

                    housing: row.housing?.trim(),

                    college: row.college?.trim(),
                };


                records.push(record);
            }


            //save every row to MongoDB
            const savedRecords = await Data.insertMany(records);


            return res.status(201).json({
                message: "File uploaded successfully",
                fileName: req.file.originalname,
                recordsSaved: savedRecords.length,
            });

        }

        catch (error) {

            console.log("Upload error:", error);

            return res.status(500).json({
                message: "Failed to process uploaded file",
                error: error.message,
            });
        }
    }
);


export default router;