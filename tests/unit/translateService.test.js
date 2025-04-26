const { translateText, detectLanguage } = require("../../src/services/translateServices");
const Settings = require("../../src/models/Settings");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Service Unit Tests", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        jest.clearAllMocks();
        await Settings.deleteMany({});
    });

    describe("Language Detection", () => {
        it("should detect language correctly", async () => {
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };
            axios.request.mockResolvedValueOnce(mockDetection);

            const result = await detectLanguage("Hello world", mockServerId);
            expect(result.data.detections[0][0].language).toBe("en");
        });

        it("should handle detection errors", async () => {
            axios.request.mockRejectedValueOnce(new Error("API Error"));
            await expect(detectLanguage("Hello", mockServerId)).rejects.toThrow("API Error");
        });
    });

    describe("Translation Core", () => {
        beforeEach(async () => {
            await Settings.create({
                serverId: mockServerId,
                languageTo: "french",
                languageFrom: "auto",
                autoTranslate: true
            });
        });

        it("should skip translation when source matches target language", async () => {
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "french", confidence: 0.9 }]],
                    },
                },
            };
            axios.request.mockResolvedValueOnce(mockDetection);

            const result = await translateText("Bonjour le monde", mockServerId);
            // Show output of result
            console.log(result.translateText);
            expect(result.translatedText).toBeNull();
        });

        it("should skip translation when confidence is low", async () => {
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.3 }]],
                    },
                },
            };
            axios.request.mockResolvedValueOnce(mockDetection);

            const result = await translateText("Hello World", mockServerId);
            expect(result.translatedText).toBeNull();
        });

        it("should use cache for repeated translations", async () => {
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };
            const mockTranslation = {
                data: {
                    data: {
                        translations: [{ translatedText: "Bonjour" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(mockDetection)
                .mockResolvedValueOnce(mockTranslation);

            // First translation
            await translateText("Hello", mockServerId);
            
            // Second translation should use cache
            await translateText("Hello", mockServerId);
            
            // Should only call API once for detection and once for translation
            expect(axios.request).toHaveBeenCalledTimes(2);
        });

        it("should respect auto-translate setting", async () => {
            await Settings.findOneAndUpdate(
                { serverId: mockServerId },
                { autoTranslate: false }
            );

            const result = await translateText("Hello", mockServerId);
            expect(result.translatedText).toBeNull();
            expect(axios.request).not.toHaveBeenCalled();
        });
    });
});
