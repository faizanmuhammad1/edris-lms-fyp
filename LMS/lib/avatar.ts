export function getAvatarUrl(seed: string | null | undefined): string {
    const safeSeed = seed || "User";

    const params = new URLSearchParams({
        seed: safeSeed,
        backgroundColor: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf", // Pastel colors
        backgroundType: "solid,gradientLinear",
        radius: "50", // Rounded
    });

    return `https://api.dicebear.com/9.x/notionists-neutral/svg?${params.toString()}`;
}
