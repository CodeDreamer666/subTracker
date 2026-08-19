import Link from "next/link";
import ManualSubscriptionDialog from "../shared/ManualSubscriptionDialog";
import { Button } from "~/components/ui/button";

export default function DashboardEmptyState() {
    return (
        <section className="border-line bg-surface grid min-h-48 place-items-center rounded-2xl border border-dashed p-7 text-center">
            <div>
                <h2 className="font-display m-0 text-2xl">Your overview is clear</h2>
                <p className="text-muted mt-2 text-sm">
                    Add a subscription manually or scan Gmail from Manage.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button asChild>
                        <Link href="/app/manage">Scan Gmail</Link>
                    </Button>
                    <ManualSubscriptionDialog
                        trigger={<Button variant="outline">Add manually</Button>}
                    />
                </div>
            </div>
        </section>
    );
}