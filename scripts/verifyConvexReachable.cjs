const targetUrl = 'https://upbeat-chickadee-781.convex.cloud';
const fatal = process.argv.includes('--fatal');

async function main() {
  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(10_000),
    });

    console.log(`Verified Convex backend is reachable: ${targetUrl} (HTTP ${response.status})`);
  } catch (error) {
    const message = `WARNING: Convex backend is unreachable: ${targetUrl} (${error.message})`;

    if (fatal) {
      console.error(message);
      process.exit(1);
    }

    console.error(message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
