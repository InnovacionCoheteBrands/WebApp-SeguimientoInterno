import { storage } from './storage';

async function seedAdsData() {
    console.log("🚀 Seeding Ads Command Center data...");

    try {
        // Create ad platforms
        const metaPlatform = await storage.createAdPlatform({
            platformName: "meta",
            displayName: "Meta (Facebook & Instagram)",
            apiCredentials: null,
            webhookUrl: null,
            isActive: "true",
            lastSyncAt: new Date(),
        });

        const googlePlatform = await storage.createAdPlatform({
            platformName: "google",
            displayName: "Google Ads",
            apiCredentials: null,
            webhookUrl: null,
            isActive: "true",
            lastSyncAt: new Date(),
        });

        const linkedinPlatform = await storage.createAdPlatform({
            platformName: "linkedin",
            displayName: "LinkedIn Ads",
            apiCredentials: null,
            webhookUrl: null,
            isActive: "true",
            lastSyncAt: new Date(),
        });

        const tiktokPlatform = await storage.createAdPlatform({
            platformName: "tiktok",
            displayName: "TikTok Ads",
            apiCredentials: null,
            webhookUrl: null,
            isActive: "false",
            lastSyncAt: null,
        });

        console.log("✅ Created 4 ad platforms");

        // Create Meta ad creatives
        const metaCreatives = [
            {
                platformId: metaPlatform.id,
                platformAdId: "meta_ad_001",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
                headline: "Transform Your Marketing ROI",
                primaryText: "Discover how leading brands are achieving 5x ROAS with our proven strategies. Book a free consultation today!",
                ctaText: "Learn More",
                status: "active",
            },
            {
                platformId: metaPlatform.id,
                platformAdId: "meta_ad_002",
                creativeType: "video",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=400",
                headline: "Boost Sales by 300%",
                primaryText: "See real results from our client success stories. Limited time offer - get started with 50% off your first month.",
                ctaText: "Get Started",
                status: "active",
            },
            {
                platformId: metaPlatform.id,
                platformAdId: "meta_ad_003",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
                headline: "Analytics Dashboard Premium",
                primaryText: "Track every metric that matters. Real-time insights for smarter decisions.",
                ctaText: "Try Free",
                status: "active",
            },
            {
                platformId: metaPlatform.id,
                platformAdId: "meta_ad_004",
                creativeType: "carousel",
                imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400",
                headline: "Enterprise Solutions",
                primaryText: "Scalable marketing automation for growing teams. Trusted by Fortune 500 companies.",
                ctaText: "Contact Sales",
                status: "active",
            },
        ];

        // Create Google ad creatives
        const googleCreatives = [
            {
                platformId: googlePlatform.id,
                platformAdId: "google_ad_001",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
                headline: "Marketing Agency | Cohete Brands",
                primaryText: "Full-service digital marketing solutions. Drive growth with data-driven campaigns.",
                ctaText: "Get Quote",
                status: "active",
            },
            {
                platformId: googlePlatform.id,
                platformAdId: "google_ad_002",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
                headline: "Team Collaboration Tools",
                primaryText: "Work smarter together. Streamline your workflow with our platform.",
                ctaText: "Start Trial",
                status: "active",
            },
            {
                platformId: googlePlatform.id,
                platformAdId: "google_ad_003",
                creativeType: "video",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400",
                headline: "2024 Marketing Trends",
                primaryText: "Stay ahead of the curve. Download our free industry report now.",
                ctaText: "Download",
                status: "active",
            },
        ];

        // Create LinkedIn ad creatives
        const linkedinCreatives = [
            {
                platformId: linkedinPlatform.id,
                platformAdId: "linkedin_ad_001",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1542744094-3966da2a7fc3?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1542744094-3966da2a7fc3?w=400",
                headline: "B2B Lead Generation Experts",
                primaryText: "Generate qualified leads for your enterprise. Strategic campaigns that convert.",
                ctaText: "Schedule Demo",
                status: "active",
            },
            {
                platformId: linkedinPlatform.id,
                platformAdId: "linkedin_ad_002",
                creativeType: "image",
                imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800",
                thumbnailUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400",
                headline: "Executive Leadership Program",
                primaryText: "Advance your career with data-driven marketing certification.",
                ctaText: "Apply Now",
                status: "active",
            },
        ];

        const allCreatives = [...metaCreatives, ...googleCreatives, ...linkedinCreatives];

        for (const creative of allCreatives) {
            await storage.createAdCreative(creative);
        }

        console.log(`✅ Created ${allCreatives.length} ad creatives`);

        // Create metrics for each creative
        const creatives = await storage.getAdCreatives();

        for (const creative of creatives) {
            // Generate realistic metrics based on creative quality
            let baseROAS = 2.0 + Math.random() * 3.0; // Random ROAS between 2.0 and 5.0
            let baseCTR = 1.5 + Math.random() * 2.5; // CTR between 1.5% and 4.0%

            // Make some ads perform better or worse
            if (creative.platformAdId.includes("001") || creative.platformAdId.includes("002")) {
                baseROAS += 1.5; // Top performers
                baseCTR += 1.0;
            } else if (creative.platformAdId === "meta_ad_004" || creative.platformAdId === "linkedin_ad_002") {
                baseROAS -= 1.5; // Bottom performers
                baseCTR -= 0.5;
            }

            const impressions = Math.floor(50000 + Math.random() * 150000);
            const clicks = Math.floor(impressions * (baseCTR / 100));
            const conversions = Math.floor(clicks * 0.05); // 5% conversion rate
            const spend = 500 + Math.random() * 4500;
            const revenue = spend * baseROAS;
            const ctr = (clicks / impressions) * 100;
            const cpa = conversions > 0 ? spend / conversions : 0;
            const roas = spend > 0 ? revenue / spend : 0;

            await storage.createAdMetric({
                creativeId: creative.id,
                platformId: creative.platformId,
                impressions,
                clicks,
                conversions,
                spend: spend.toFixed(2),
                revenue: revenue.toFixed(2),
                ctr: ctr.toFixed(2),
                cpa: cpa.toFixed(2),
                roas: roas.toFixed(2),
                metricDate: new Date(),
            });
        }

        console.log(`✅ Created metrics for ${creatives.length} creatives`);

        // Calculate and display summary
        const blendedROAS = await storage.getBlendedROAS();
        console.log("\n📊 Ads Command Center Summary:");
        console.log(`   Total Spend: $${blendedROAS.totalSpend.toFixed(2)}`);
        console.log(`   Total Revenue: $${blendedROAS.totalRevenue.toFixed(2)}`);
        console.log(`   Blended ROAS: ${blendedROAS.roas.toFixed(2)}x`);

        const topCreatives = await storage.getTopPerformingCreatives(3);
        console.log("\n🏆 Top 3 Performers:");
        topCreatives.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.headline} - ROAS: ${c.metrics.roas}x`);
        });

        console.log("\n✨ Ads Command Center data seeded successfully!");

    } catch (error) {
        console.error("❌ Error seeding ads data:", error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedAdsData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export { seedAdsData };
