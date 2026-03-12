import bcrypt from "bcryptjs";

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) continue;

    const key = current.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith("--") ? next : true;
  }

  return args;
}

const USER_ROLES = ["ADMIN", "PM", "GM", "FS", "TENANT"];

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const fullName = args.fullName || "bedru mekiyu";
  const email = (args.email || "bedru@gmail.com").toLowerCase();
  const phone = args.phone || undefined;
  const role = args.role || "ADMIN";
  const password = args.password;

  if (!password) {
    console.error("Missing required argument: --password");
    console.error(
      'Example: node backend/scripts/generateCompassUser.mjs --password "Admin123!"'
    );
    process.exit(1);
  }

  if (!USER_ROLES.includes(role)) {
    console.error(
      `Invalid role \"${role}\". Allowed roles: ${USER_ROLES.join(", ")}`
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const document = {
    fullName,
    email,
    ...(phone ? { phone } : {}),
    passwordHash,
    role,
    mfaEnabled: false,
    mfaMethod: "NONE",
    status: "ACTIVE",
    createdAt: { $date: now },
    updatedAt: { $date: now },
  };

  console.log(JSON.stringify(document, null, 2));
}

main().catch((error) => {
  console.error("Failed to generate Compass user document:", error);
  process.exit(1);
});