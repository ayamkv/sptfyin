<script>
    import { Label } from '$lib/components/ui/label';
	import * as Accordion from '$lib/components/ui/accordion';
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
</script>

<Accordion.Root class="m-0 p-0 text-foreground ">
    <Accordion.Item value="item-1" class>
        <Accordion.Trigger class="py-1">🤔 About </Accordion.Trigger>
        <Accordion.Content m-0>
            <Label for="url" class="my-2">About the website</Label>
            <div class="mb-2 flex w-full min-w-full flex-col items-center space-x-2">
                <div class="text-xs">
                    <p class="text-xs">
                        
                </div>
            </div>
        </Accordion.Content>
    </Accordion.Item>
    <Dialog.Root class="my-2 hidden w-full transition-all md:block md:flex-none">
        <Dialog.Trigger>
            <Button
                class="my-2  w-full transition-all hover:bg-primary  hover:text-black md:block md:flex-none"
                variant="secondary"
                >💓 Buy me a ko-fi
            </Button>
        </Dialog.Trigger>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title></Dialog.Title>
                <Dialog.Description>
                    <iframe
                        id="kofiframe"
                        src="https://ko-fi.com/freqtion/?hidefeed=true&widget=true&embed=true&preview=true"
                        style="border:none;width:100%;background:#0A0911;border-radius:0.7em"
                        height="712"
                        title="freqtion"
                    ></iframe>
                </Dialog.Description>
            </Dialog.Header>
        </Dialog.Content>
    </Dialog.Root>
</Accordion.Root>