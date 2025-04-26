const Settings = require("../../src/models/Settings");

describe("Settings Model Tests", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        await Settings.deleteMany({});
    });

    it("should create settings with default values", async () => {
        const settings = await Settings.create({ serverId: mockServerId });
        expect(settings.serverId).toBe(mockServerId);
        expect(settings.languageTo).toBe("en");
        expect(settings.languageFrom).toBe("auto");
        expect(settings.autoTranslate).toBe(true);
    });

    it("should update settings successfully", async () => {
        await Settings.create({ serverId: mockServerId });
        
        await Settings.findOneAndUpdate(
            { serverId: mockServerId },
            { 
                languageTo: "fr",
                languageFrom: "en",
                autoTranslate: false
            }
        );

        const updated = await Settings.findOne({ serverId: mockServerId });
        expect(updated.languageTo).toBe("fr");
        expect(updated.languageFrom).toBe("en");
        expect(updated.autoTranslate).toBe(false);
    });

    it("should handle multiple server settings", async () => {
        const server1 = "server-1";
        const server2 = "server-2";

        await Settings.create({ 
            serverId: server1,
            languageTo: "fr"
        });

        await Settings.create({
            serverId: server2,
            languageTo: "es"
        });

        const settings1 = await Settings.findOne({ serverId: server1 });
        const settings2 = await Settings.findOne({ serverId: server2 });

        expect(settings1.languageTo).toBe("fr");
        expect(settings2.languageTo).toBe("es");
    });
});
