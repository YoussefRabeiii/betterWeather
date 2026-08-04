import { headers } from "next/headers";
import { WeatherApp } from "@/components/weather/WeatherApp";
import { loadInitialWeather } from "@/lib/loadWeather";

export default async function Home() {
	const initial = await loadInitialWeather(await headers());

	return (
		<WeatherApp
			initialWeather={initial?.weather ?? null}
			initialCityId={initial?.cityId ?? null}
		/>
	);
}
