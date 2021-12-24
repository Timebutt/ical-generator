"use strict";

import ICalEvent from "./event";
import { addOrGetCustomAttributes, escape } from "./tools";

interface ICalInternalAttachmentData {
    fileName: string | null;
    url: string | null;
    x: [string, string][];
}

export interface ICalAttachmentData {
    fileName?: string | null;
    url?: string | null;
    x?:
        | { key: string; value: string }[]
        | [string, string][]
        | Record<string, string>;
}

export interface ICalAttachmentJSONData {
    fileName: string | null;
    url: string | null;
    x: { key: string; value: string }[];
}

/**
 * Usually you get an `ICalAttendee` object like this:
 *
 * ```javascript
 * import ical from 'ical-generator';
 * const calendar = ical();
 * const event = calendar.createEvent();
 * const attendee = event.createAttendee();
 * ```
 *
 * You can also use the [[`ICalAttendee`]] object directly:
 *
 * ```javascript
 * import ical, {ICalAttendee} from 'ical-generator';
 * const attendee = new ICalAttendee();
 * event.attendees([attendee]);
 * ```
 */
export default class ICalAttachment {
    private readonly data: ICalInternalAttachmentData;
    private readonly event: ICalEvent;

    /**
     * Constructor of [[`ICalAttachment`]]. The event reference is
     * required to query the calendar's timezone when required.
     *
     * @param data Attachment Data
     * @param calendar Reference to ICalEvent object
     */
    constructor(data: ICalAttachmentData, event: ICalEvent) {
        this.data = {
            fileName: null,
            url: null,
            x: [],
        };
        this.event = event;
        if (!this.event) {
            throw new Error("`event` option required!");
        }

        data.fileName !== undefined && this.fileName(data.fileName);
        data.url !== undefined && this.url(data.url);
        data.x !== undefined && this.x(data.x);
    }

    /**
     * Get the attachment's fileName
     * @since 0.2.0
     */
    fileName(): string | null;

    /**
     * Set the attachments's fileName
     * @since 0.2.0
     */
    fileName(fileName: string | null): this;
    fileName(fileName?: string | null): this | string | null {
        if (fileName === undefined) {
            return this.data.fileName;
        }

        this.data.fileName = fileName || null;
        return this;
    }

    /**
     * Get the attachment's url
     * @since 0.2.0
     */
    url(): string | null;

    /**
     * Set the attachment's url
     * @since 0.2.0
     */
    url(url: string | null): this;
    url(url?: string | null): this | string | null {
        if (!url) {
            return this.data.url;
        }

        this.data.url = url;
        return this;
    }

    /**
     * Set X-* attributes. Woun't filter double attributes,
     * which are also added by another method (e.g. status),
     * so these attributes may be inserted twice.
     *
     * ```javascript
     * attendee.x([
     *     {
     *         key: "X-MY-CUSTOM-ATTR",
     *         value: "1337!"
     *     }
     * ]);
     *
     * attendee.x([
     *     ["X-MY-CUSTOM-ATTR", "1337!"]
     * ]);
     *
     * attendee.x({
     *     "X-MY-CUSTOM-ATTR": "1337!"
     * });
     * ```
     *
     * @since 1.9.0
     */
    x(
        keyOrArray:
            | { key: string; value: string }[]
            | [string, string][]
            | Record<string, string>
    ): this;

    /**
     * Set a X-* attribute. Woun't filter double attributes,
     * which are also added by another method (e.g. status),
     * so these attributes may be inserted twice.
     *
     * ```javascript
     * attendee.x("X-MY-CUSTOM-ATTR", "1337!");
     * ```
     *
     * @since 1.9.0
     */
    x(keyOrArray: string, value: string): this;

    /**
     * Get all custom X-* attributes.
     * @since 1.9.0
     */
    x(): { key: string; value: string }[];
    x(
        keyOrArray?:
            | { key: string; value: string }[]
            | [string, string][]
            | Record<string, string>
            | string,
        value?: string
    ): this | void | { key: string; value: string }[] {
        if (keyOrArray === undefined) {
            return addOrGetCustomAttributes(this.data);
        }

        if (typeof keyOrArray === "string" && typeof value === "string") {
            addOrGetCustomAttributes(this.data, keyOrArray, value);
        } else if (typeof keyOrArray === "object") {
            addOrGetCustomAttributes(this.data, keyOrArray);
        } else {
            throw new Error("Either key or value is not a string!");
        }

        return this;
    }

    /**
     * Return a shallow copy of the attachment's options for JSON stringification.
     * Can be used for persistence.
     *
     * @since 0.2.4
     */
    toJSON(): ICalAttachmentJSONData {
        return Object.assign({}, this.data, {
            x: this.x(),
        });
    }

    /**
     * Return generated attachment as a string.
     *
     * ```javascript
     * console.log(attendee.toString()); // → ATTACH;FILENAME=…
     * ```
     */
    toString(): string {
        let g = "ATTACH";

        // FILENAME
        g += ";FILENAME=" + this.data.fileName + ":" + this.data.url;

        // CUSTOM X ATTRIBUTES
        if (this.data.x.length) {
            g +=
                ";" +
                this.data.x
                    .map(
                        ([key, value]) =>
                            key.toUpperCase() + "=" + escape(value)
                    )
                    .join(";");
        }

        return g;
    }
}
