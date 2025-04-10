const { translateText } = require("../../src/services/translateServices");
const Blacklist = require("../../src/models/Blacklist");
const Settings = require("../../src/models/Settings");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Service with Blacklist Integration", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        jest.clearAllMocks();
        await Blacklist.deleteMany({});
        await Settings.deleteMany({});
    });

    it("should block translation when source language is blacklisted", async () => {
        // Create blacklist with French blocked
        await Blacklist.create({
            serverId: mockServerId,
            blacklistedLanguages: ["fr"],
        });

        // Mock settings
        await Settings.create({
            serverId: mockServerId,
            languageTo: "en",
        });

        // Mock detection response for French text
        const detectResponse = {
            data: {
                data: {
                    detections: [[{ language: "fr", confidence: 0.9 }]],
                },
            },
        };

        axios.request.mockResolvedValueOnce(detectResponse);

        await expect(
            translateText("Bonjour le monde", mockServerId)
        ).rejects.toThrow("Blacklisted language detected: fr");
    });

    it("should allow translation when language is not blacklisted", async () => {
        // Create blacklist with French blocked
        await Blacklist.create({
            serverId: mockServerId,
            blacklistedLanguages: ["fr"],
        });

        // Mock settings
        await Settings.create({
            serverId: mockServerId,
            languageTo: "fr",
        });

        // Mock detection response for English text
        const detectResponse = {
            data: {
                data: {
                    detections: [[{ language: "en", confidence: 0.9 }]],
                },
            },
        };

        // Mock translation response
        const translateResponse = {
            data: {
                data: {
                    translations: [{ translatedText: "Bonjour le monde" }],
                },
            },
        };

        axios.request
            .mockResolvedValueOnce(detectResponse)
            .mockResolvedValueOnce(translateResponse);

        const result = await translateText("Hello world", mockServerId);
        expect(result.translatedText).toBe("Bonjour le monde");
    });
});
